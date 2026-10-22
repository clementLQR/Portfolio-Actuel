import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../../data/navigation";
import { Icon } from "../ui/Icon";
import "./IconRail.scss";

/** Rail d'icônes vertical à gauche ; barre d'icônes en bas sur mobile */
export function IconRail() {
  return (
    <nav className="rail" aria-label="Navigation rapide">
      <ul className="rail__list">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end} className="rail__link">
              <Icon name={item.icon} size={22} />
              <span className="rail__tip">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
