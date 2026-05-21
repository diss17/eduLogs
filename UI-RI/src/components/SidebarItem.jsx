export default function SidebarItem({ icon, text, active }) {
  return (
    <button
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-lg transition ${
        active
          ? "bg-blue-600 text-white"
          : "hover:bg-white/10 text-white"
      }`}
    >
      {icon}
      {text}
    </button>
  );
}