import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
// Chargeur de three.js directement : drei n'apportait que useGLTF, pour plusieurs centaines de Ko
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import gsap from "gsap";
import {
  AnimationMixer,
  Box3,
  BufferAttribute,
  Euler,
  Group,
  MathUtils,
  Matrix4,
  Mesh,
  Plane,
  Quaternion,
  Vector3,
  type AnimationAction,
  type AnimationClip,
  type Bone,
  type BufferGeometry,
  type Material,
  type Object3D,
  type SkinnedMesh,
} from "three";
import type { Theme } from "../store/useThemeStore";
import {
  HEAD_CENTER_Y,
  LOOK_IDLE_MS,
  MODEL_HEIGHT,
  MODEL_URL,
  MODEL_WIDTH,
  TRAVEL_DURATION_S,
  VIEW_TILT,
} from "./constants";
import { SocleHolographique } from "./SocleHolographique";
import { useBlink } from "./useBlink";
import { lookAngles, pointer } from "./useLookAt";
import { mascotScreen, useMascotteStore, type Mood } from "./useMascotteStore";

type BoneName = "Racine" | "Corps" | "Tete" | "Bras_G" | "Bras_D" | "Jambe_G" | "Jambe_D" | "Oreille_G" | "Oreille_D" | "Queue";
type ClipName = "Idle" | "Curieuse" | "Heureuse" | "Surprise" | "Reflechie" | "Saut" | "Marche";

const BONE_NAMES: readonly BoneName[] = ["Racine", "Corps", "Tete", "Bras_G", "Bras_D", "Jambe_G", "Jambe_D", "Oreille_G", "Oreille_D", "Queue"];
const CLIP_NAMES: readonly ClipName[] = ["Idle", "Curieuse", "Heureuse", "Surprise", "Reflechie", "Saut", "Marche"];
const CLIP_BY_MOOD: Record<Mood, ClipName> = {
  neutre: "Idle",
  curieuse: "Curieuse",
  heureuse: "Heureuse",
  surprise: "Surprise",
  reflechie: "Reflechie",
};

interface BoneInfo {
  bone: Bone;
  rest: Quaternion;
  /** Orientation du parent au repos (repère du modèle) et son inverse */
  parent: Quaternion;
  parentInv: Quaternion;
  /** Côté du corps : -1 à gauche de l'écran, 1 à droite */
  side: number;
}

interface Rig {
  bones: Partial<Record<BoneName, BoneInfo>>;
  eyes: Mesh[];
  materials: Material[];
  mixer: AnimationMixer;
  actions: Partial<Record<ClipName, AnimationAction>>;
}

interface Placement {
  /** Centre horizontal (px écran) */
  cx: number;
  /** Ligne des pieds (px écran) */
  foot: number;
  /** Hauteur affichée (px) */
  h: number;
}

// Le GLTFLoader suffixe parfois les noms en double (« Tete_1 ») : on les normalise
function baseName(name: string): string {
  return name.replace(/_\d+$/, "");
}

function isBoneName(name: string): name is BoneName {
  return (BONE_NAMES as readonly string[]).includes(name);
}

/**
 * Les yeux sont skinnés à 100 % sur l'os Tete : les écraser via mesh.scale n'aurait
 * pas de pivot correct. On les recrée en maillages simples, enfants de l'os, avec
 * la géométrie exprimée dans le repère de l'os (même résultat que le shader de skinning).
 */
// Modèle compressé avec Meshopt : le décodeur est fourni par three.js
function withMeshopt(loader: GLTFLoader): void {
  loader.setMeshoptDecoder(MeshoptDecoder);
}

// Le modèle est quantifié (entiers normalisés) : on repasse en flottants avant de
// transformer la géométrie, sinon les valeurs sortant de [-1, 1] seraient écrasées
type GeometryAttribute = NonNullable<BufferGeometry["attributes"][string]>;

function toFloatAttribute(attribute: GeometryAttribute): BufferAttribute {
  const { count, itemSize } = attribute;
  const array = new Float32Array(count * itemSize);
  for (let i = 0; i < count; i++) {
    const o = i * itemSize;
    array[o] = attribute.getX(i);
    if (itemSize > 1) array[o + 1] = attribute.getY(i);
    if (itemSize > 2) array[o + 2] = attribute.getZ(i);
    if (itemSize > 3) array[o + 3] = attribute.getW(i);
  }
  return new BufferAttribute(array, itemSize);
}

function detachToBone(mesh: SkinnedMesh, bone: Bone): Mesh {
  const index = mesh.skeleton.bones.indexOf(bone);
  const boneInverse = mesh.skeleton.boneInverses[index] ?? new Matrix4();
  const toBone = new Matrix4().multiplyMatrices(boneInverse, mesh.bindMatrix);

  const geometry = mesh.geometry.clone();
  geometry.deleteAttribute("skinIndex");
  geometry.deleteAttribute("skinWeight");
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    geometry.setAttribute(name, toFloatAttribute(attribute));
  }
  geometry.applyMatrix4(toBone);
  geometry.computeBoundingBox();
  const center = new Vector3();
  (geometry.boundingBox ?? new Box3()).getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);

  const eye = new Mesh(geometry, mesh.material);
  eye.name = `${baseName(mesh.name)}_Libre`;
  eye.position.copy(center);
  eye.frustumCulled = false;
  bone.add(eye);
  mesh.visible = false;
  return eye;
}

// Une seule préparation par scène, même si React monte le composant deux fois
const rigCache = new WeakMap<Object3D, Rig>();

function prepareRig(scene: Object3D, animations: AnimationClip[]): Rig {
  const cached = rigCache.get(scene);
  if (cached) return cached;
  scene.updateMatrixWorld(true);

  const bones: Rig["bones"] = {};
  const skinned: SkinnedMesh[] = [];
  const materials = new Set<Material>();

  scene.traverse((object) => {
    const name = baseName(object.name);
    if ((object as Bone).isBone && isBoneName(name)) {
      const bone = object as Bone;
      const parent = new Quaternion();
      bone.parent?.getWorldQuaternion(parent);
      const position = new Vector3();
      bone.getWorldPosition(position);
      bones[name] = {
        bone,
        rest: bone.quaternion.clone(),
        parent,
        parentInv: parent.clone().invert(),
        side: Math.sign(position.x) || 1,
      };
    }
    if ((object as SkinnedMesh).isSkinnedMesh) {
      const mesh = object as SkinnedMesh;
      // Le skinning déplace les sommets hors de la boîte englobante d'origine
      mesh.frustumCulled = false;
      skinned.push(mesh);
      const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      list.forEach((material) => materials.add(material));
    }
  });

  // Matériaux mats, dégradés en couleurs de sommets, yeux légèrement lumineux
  for (const material of materials) {
    const m = material as Material & {
      metalness?: number;
      roughness?: number;
      envMapIntensity?: number;
      specularIntensity?: number;
      emissive?: { copy: (c: unknown) => void };
      emissiveIntensity?: number;
      color?: unknown;
      vertexColors: boolean;
    };
    if (m.metalness !== undefined) m.metalness = 0;
    if (m.envMapIntensity !== undefined) m.envMapIntensity = 0;
    if (m.specularIntensity !== undefined) m.specularIntensity = 0.25;
    if (material.name === "Mascotte_Degrade") m.vertexColors = true;
    if (material.name.startsWith("Mascotte_Oeil") && m.emissive && m.color) {
      m.emissive.copy(m.color);
      m.emissiveIntensity = material.name === "Mascotte_Oeil_Orange" ? 0.45 : 0.7;
    }
    material.needsUpdate = true;
  }

  const head = bones.Tete?.bone;
  const eyes = head
    ? skinned.filter((mesh) => baseName(mesh.name).startsWith("Oeil_")).map((mesh) => detachToBone(mesh, head))
    : [];

  const mixer = new AnimationMixer(scene);
  const actions: Rig["actions"] = {};
  for (const clip of animations) {
    const name = CLIP_NAMES.find((n) => n === clip.name);
    if (name) actions[name] = mixer.clipAction(clip);
  }

  const rig: Rig = { bones, eyes, materials: [...materials], mixer, actions };
  rigCache.set(scene, rig);
  return rig;
}

const tmpEuler = new Euler(0, 0, 0, "YXZ");
const tmpQuat = new Quaternion();
const tmpBase = new Quaternion();

/**
 * Applique une rotation exprimée dans les axes du modèle (X : tangage, Y : lacet, Z : roulis)
 * par-dessus la pose de base (repos, ou pose du clip si des animations existent).
 */
function rotateBone(info: BoneInfo | undefined, x: number, y: number, z: number, useMixerPose: boolean): void {
  if (!info) return;
  tmpBase.copy(useMixerPose ? info.bone.quaternion : info.rest);
  tmpQuat.setFromEuler(tmpEuler.set(x, y, z));
  info.bone.quaternion.copy(info.parentInv).multiply(tmpQuat).multiply(info.parent).multiply(tmpBase);
}

function damp(current: number, target: number, lambda: number, dt: number): number {
  return MathUtils.damp(current, target, lambda, dt);
}

function placementFor(el: HTMLElement): Placement {
  const rect = el.getBoundingClientRect();
  const h = Math.min(rect.height, (rect.width * MODEL_HEIGHT) / MODEL_WIDTH);
  const peek = el.hasAttribute("data-mascot-peek");
  return {
    cx: rect.left + rect.width / 2,
    // En mode « coucou », seule la tête dépasse du bas de l'ancre
    foot: peek ? rect.bottom + h * 0.36 : rect.bottom,
    h,
  };
}

const GAZE: Record<string, { yaw: number; pitch: number }> = {
  left: { yaw: -0.35, pitch: 0.05 },
  right: { yaw: 0.35, pitch: 0.05 },
  "down-left": { yaw: -0.4, pitch: 0.28 },
  "down-right": { yaw: 0.4, pitch: 0.28 },
  down: { yaw: 0, pitch: 0.3 },
};

interface MascotteProps {
  reducedMotion: boolean;
  /** Regard vers la souris (désactivé sur mobile et au tactile) */
  followPointer: boolean;
  theme: Theme;
}

export function Mascotte({ reducedMotion, followPointer, theme }: MascotteProps) {
  const gltf = useLoader(GLTFLoader, MODEL_URL, withMeshopt);
  const rig = useMemo(() => prepareRig(gltf.scene, gltf.animations), [gltf]);
  const hasClips = Object.keys(rig.actions).length > 0;

  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);

  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const socleOpacity = useRef(0);
  const blink = useBlink();
  const clipPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 1e6), []);
  const activeClip = useRef<AnimationAction | null>(null);

  const travel = useRef({
    anchor: null as HTMLElement | null,
    progress: 1,
    from: { cx: 0, foot: 0, h: 0 } as Placement,
    current: { cx: 0, foot: 0, h: 0 } as Placement,
    placed: false,
    tween: null as gsap.core.Tween | null,
    /** Saut en arc, ou course quand le trajet est surtout horizontal */
    mode: "jump" as "jump" | "run",
    /** Sens de la course : -1 vers la gauche, 1 vers la droite */
    dir: 1,
  });

  const pose = useRef({
    yaw: 0,
    pitch: 0,
    roll: 0,
    lean: 0,
    armL: 0,
    armR: 0,
    ears: 0,
    spin: 0,
    visible: 0,
    bounceAt: -10,
    /** Orientation du corps dans le sens de la course */
    bodyYaw: 0,
    /** 0 = immobile, 1 = en pleine course (fondu entre les deux) */
    run: 0,
  });

  // Plan de coupe pour la page À propos (la mascotte « passe la tête »)
  useEffect(() => {
    gl.localClippingEnabled = true;
    rig.materials.forEach((material) => {
      material.clippingPlanes = [clipPlane];
      material.needsUpdate = true;
    });
  }, [gl, rig, clipPlane]);

  // Clips du modèle (absents pour l'instant : tout reste procédural)
  const playClip = (name: ClipName) => {
    const next = rig.actions[name];
    if (!next || next === activeClip.current) return;
    next.reset().fadeIn(0.3).play();
    activeClip.current?.fadeOut(0.3);
    activeClip.current = next;
  };

  useEffect(() => {
    playClip(CLIP_BY_MOOD[useMascotteStore.getState().mood]);
    return useMascotteStore.subscribe((state, prev) => {
      if (state.moodNonce !== prev.moodNonce) pose.current.bounceAt = performance.now() / 1000;
      if (state.mood !== prev.mood) playClip(CLIP_BY_MOOD[state.mood]);
      // Easter egg : elle tourne sur elle-même, étourdie
      if (state.dizzy && !prev.dizzy && !reducedMotion) {
        gsap.to(pose.current, { spin: pose.current.spin + Math.PI * 4, duration: 1.6, ease: "power2.out" });
      }
    });
  }, [rig, reducedMotion]);

  useEffect(
    () => () => {
      travel.current.tween?.kill();
    },
    [],
  );

  const startTravel = (anchor: HTMLElement | null) => {
    const tr = travel.current;
    tr.tween?.kill();
    tr.anchor = anchor;
    if (!anchor) return;

    if (!tr.placed || reducedMotion) {
      // Première apparition : on se pose directement, avec un petit rebond
      tr.current = placementFor(anchor);
      tr.progress = 1;
      tr.placed = true;
      pose.current.bounceAt = performance.now() / 1000;
      return;
    }
    tr.from = { ...tr.current };
    tr.progress = 0;

    // Trajet surtout horizontal : elle court ; sinon elle saute
    const target = placementFor(anchor);
    const dx = target.cx - tr.from.cx;
    const dy = target.foot - tr.from.foot;
    const run = Math.abs(dx) > 40 && Math.abs(dy) < 0.6 * Math.max(target.h, tr.from.h);
    tr.mode = run ? "run" : "jump";
    tr.dir = Math.sign(dx) || 1;

    playClip(run ? "Marche" : rig.actions.Saut ? "Saut" : "Marche");
    tr.tween = gsap.to(tr, {
      progress: 1,
      // En courant, la durée dépend de la distance (~850 px/s)
      duration: run ? MathUtils.clamp(Math.abs(dx) / 850, 0.7, 1.8) : TRAVEL_DURATION_S,
      ease: run ? "power1.inOut" : "power2.inOut",
      onComplete: () => {
        pose.current.bounceAt = performance.now() / 1000;
        playClip(CLIP_BY_MOOD[useMascotteStore.getState().mood]);
      },
    });
  };

  useFrame((_, delta) => {
    const group = groupRef.current;
    const body = bodyRef.current;
    if (!group || !body) return;

    const dt = Math.min(delta, 1 / 20);
    const now = performance.now();
    const t = now / 1000;
    const state = useMascotteStore.getState();
    const tr = travel.current;
    const p = pose.current;
    const animate = !reducedMotion;

    // Les clips d'abord, le procédural ensuite (par-dessus)
    if (hasClips) rig.mixer.update(dt);

    /* ---------- 1. Placement sur l'ancre ---------- */
    const anchor = state.anchor?.isConnected ? state.anchor : null;
    if (anchor !== tr.anchor) startTravel(anchor);

    let jump = 0;
    if (anchor) {
      const target = placementFor(anchor);
      const k = tr.progress;
      tr.current = {
        cx: MathUtils.lerp(tr.from.cx, target.cx, k),
        foot: MathUtils.lerp(tr.from.foot, target.foot, k),
        h: MathUtils.lerp(tr.from.h, target.h, k),
      };
      if (k >= 1) tr.current = target;
      // Petit saut en arc pendant le trajet (pas d'arc en course)
      if (tr.mode === "jump") {
        const distance = Math.hypot(target.cx - tr.from.cx, target.foot - tr.from.foot);
        jump = Math.sin(Math.PI * k) * (0.3 * tr.current.h + 0.1 * Math.min(distance, 900));
      }
    }

    const running = animate && tr.mode === "run" && tr.progress < 1;
    p.run = damp(p.run, running ? 1 : 0, 10, dt);
    // Cadence des foulées
    const stride = t * 15;

    p.visible = damp(p.visible, anchor ? 1 : 0, 8, dt);
    const { cx, foot, h } = tr.current;
    const scale = Math.max((h / MODEL_HEIGHT) * p.visible, 1e-4);

    const hasSocle = Boolean(anchor?.hasAttribute("data-mascot-socle"));
    socleOpacity.current = damp(socleOpacity.current, hasSocle && tr.progress >= 1 ? 1 : 0, 5, dt);

    // Flottement au-dessus du socle et rebonds (en px)
    const float = animate && hasSocle ? (0.06 + 0.035 * Math.sin(t * 1.6)) * h * socleOpacity.current : 0;
    const since = t - p.bounceAt;
    const bounce = animate && since < 1.4 ? Math.abs(Math.sin(since * 9)) * Math.exp(-since * 4) * 0.12 * h : 0;
    // Petit rebond à chaque foulée
    const runBob = Math.abs(Math.sin(stride)) * 0.07 * tr.current.h * p.run;
    const lift = jump + float + bounce + runBob;

    group.position.set(cx - size.width / 2, size.height / 2 - foot, 0);
    group.scale.setScalar(scale);
    body.position.y = lift / scale;

    // Zone cliquable HTML synchronisée
    const peek = Boolean(anchor?.hasAttribute("data-mascot-peek"));
    const shownHeight = peek ? h * 0.55 : h;
    mascotScreen.width = h * 0.75;
    mascotScreen.height = shownHeight;
    mascotScreen.x = cx - mascotScreen.width / 2;
    mascotScreen.y = foot - lift - h;
    mascotScreen.visible = p.visible > 0.6;

    // Coupe sous le bord de l'ancre en mode « coucou »
    if (peek && anchor) {
      const edge = size.height / 2 - anchor.getBoundingClientRect().bottom;
      clipPlane.constant = -edge;
    } else {
      clipPlane.constant = 1e6;
    }

    /* ---------- 2. Pose neutre en mouvement réduit ---------- */
    if (!animate) {
      body.rotation.set(VIEW_TILT, 0, 0);
      body.scale.setScalar(1);
      if (!hasClips) Object.values(rig.bones).forEach((info) => info?.bone.quaternion.copy(info.rest));
      rig.eyes.forEach((eye) => eye.scale.setY(state.sleeping ? 0.12 : 1));
      return;
    }

    /* ---------- 3. Regard ---------- */
    const headX = cx;
    const headY = foot - lift - HEAD_CENTER_Y * (h / MODEL_HEIGHT);
    let yawTarget = 0;
    let pitchTarget = 0;
    const gaze = GAZE[anchor?.dataset.mascotGaze ?? ""];
    const pointerFresh = followPointer && pointer.active && now - pointer.lastMove < LOOK_IDLE_MS;

    if (state.sleeping) {
      pitchTarget = 0.35;
    } else if (state.focus) {
      ({ yaw: yawTarget, pitch: pitchTarget } = lookAngles(headX, headY, state.focus.x, state.focus.y));
    } else if (pointerFresh) {
      ({ yaw: yawTarget, pitch: pitchTarget } = lookAngles(headX, headY, pointer.x, pointer.y));
    } else if (gaze) {
      yawTarget = gaze.yaw;
      pitchTarget = gaze.pitch;
    }

    /* ---------- 4. Humeur ---------- */
    let roll = 0;
    let lean = 0;
    let armL = 0.08 + Math.sin(t * 1.7) * 0.05;
    let armR = 0.08 + Math.sin(t * 1.7 + 1.2) * 0.05;
    let ears = Math.sin(t * 1.3) * 0.05;
    let pitchBias = 0;
    let tailSpeed = 2.6;
    let tailAmp = 0.3;
    let eyeScale = blink(now);

    if (state.sleeping) {
      roll = 0.16;
      armL = 0;
      armR = 0;
      ears = -0.3;
      tailAmp = 0.05;
      tailSpeed = 0.8;
      eyeScale = 0.1;
    } else {
      switch (state.mood) {
        case "curieuse":
          // Elle se penche vers ce qu'elle regarde
          roll = 0.2 * Math.sign(yawTarget || 1);
          lean = -yawTarget * 0.3;
          pitchBias = 0.06;
          ears += 0.22;
          break;
        case "heureuse":
          armL = 1.15 + Math.sin(t * 11) * 0.25;
          armR = 1.15 + Math.sin(t * 11 + Math.PI) * 0.25;
          ears += 0.3;
          tailSpeed = 8;
          tailAmp = 0.5;
          eyeScale *= 0.78;
          break;
        case "surprise":
          armL = 1.5;
          armR = 1.5;
          ears += 0.5;
          pitchBias = -0.12;
          eyeScale *= 1.18;
          break;
        case "reflechie":
          roll = -0.24;
          pitchBias = -0.14;
          armR = 0.95;
          ears -= 0.12;
          tailSpeed = 1.4;
          break;
        default:
          break;
      }
    }
    if (state.dizzy) {
      roll = Math.sin(t * 7) * 0.3;
      eyeScale = 0.5;
    }
    // Effort : penchée en arrière, bras tendus vers ce qu'elle tire (à sa droite), yeux plissés
    if (state.pulling) {
      yawTarget = 0.45;
      pitchTarget = 0.12;
      roll = -0.12;
      lean = 0.3 + Math.sin(t * 28) * 0.025;
      armR = 1.4 + Math.sin(t * 24) * 0.06;
      armL = 1.05 + Math.sin(t * 24 + 1) * 0.06;
      ears = -0.2;
      tailSpeed = 12;
      tailAmp = 0.45;
      eyeScale = 0.4;
    }

    // Course : elle regarde devant elle, bras plus bas pour balancer
    if (running) {
      yawTarget = 0;
      pitchTarget = 0.05;
      roll = 0;
      lean = 0;
      armL = 0.35;
      armR = 0.35;
      ears = 0.35;
      tailSpeed = 14;
      tailAmp = 0.5;
    }

    p.yaw = damp(p.yaw, yawTarget, 7, dt);
    p.pitch = damp(p.pitch, pitchTarget + pitchBias, 7, dt);
    p.roll = damp(p.roll, roll, 6, dt);
    p.lean = damp(p.lean, lean, 5, dt);
    p.armL = damp(p.armL, armL, 9, dt);
    p.armR = damp(p.armR, armR, 9, dt);
    p.ears = damp(p.ears, ears, 8, dt);

    /* ---------- 5. Os ---------- */
    const { bones } = rig;
    rotateBone(bones.Tete, p.pitch, p.yaw, p.roll, hasClips);
    // Bras et jambes alternent pendant la course
    const swing = Math.sin(stride) * p.run;
    if (bones.Bras_G) rotateBone(bones.Bras_G, swing * 0.8, 0, bones.Bras_G.side * p.armL, hasClips);
    if (bones.Bras_D) rotateBone(bones.Bras_D, -swing * 0.8, 0, bones.Bras_D.side * p.armR, hasClips);
    rotateBone(bones.Jambe_G, -swing * 0.75, 0, 0, hasClips);
    rotateBone(bones.Jambe_D, swing * 0.75, 0, 0, hasClips);
    if (bones.Oreille_G) rotateBone(bones.Oreille_G, 0, 0, bones.Oreille_G.side * p.ears, hasClips);
    if (bones.Oreille_D) rotateBone(bones.Oreille_D, 0, 0, bones.Oreille_D.side * p.ears, hasClips);
    rotateBone(bones.Queue, 0, Math.sin(t * tailSpeed) * tailAmp, 0, hasClips);

    // Le corps suit un peu la tête, se penche, respire, et se tourne dans le sens de la course
    p.bodyYaw = damp(p.bodyYaw, running ? tr.dir * 1.05 : 0, 8, dt);
    body.rotation.order = "YXZ";
    body.rotation.set(VIEW_TILT + 0.2 * p.run, p.yaw * 0.3 + p.spin + p.bodyYaw, p.lean);
    const squash = since < 0.5 ? Math.sin(since * 12) * Math.exp(-since * 6) * 0.08 : 0;
    const breath = Math.sin(t * 2.2) * 0.012;
    body.scale.set(1 + squash, 1 - squash + breath, 1 + squash);

    rig.eyes.forEach((eye) => eye.scale.setY(eyeScale));
  });

  return (
    <group ref={groupRef}>
      <SocleHolographique opacity={socleOpacity} theme={theme} animated={!reducedMotion} />
      <group ref={bodyRef}>
        <primitive object={gltf.scene} />
      </group>
    </group>
  );
}

useLoader.preload(GLTFLoader, MODEL_URL, withMeshopt);
