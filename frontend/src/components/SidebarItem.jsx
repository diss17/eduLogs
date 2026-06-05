import { Link } from "react-router-dom";

export default function SidebarItem({
  icon,
  text,
  active,
  to,
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition ${
        active
          ? "bg-blue-600 text-white"
          : "hover:bg-white/10 text-white"
      }`}
    >
      {icon}
      {text}
    </Link>
  );
}