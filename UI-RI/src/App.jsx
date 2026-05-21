import { useState, useEffect } from "react";
import {
  CalendarDays,
  AlertTriangle,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Save,
} from "lucide-react";

import SidebarItem from "./components/SidebarItem";

export default function App() {

  const [fecha, setFecha] = useState("");
  const [alumno, setAlumno] = useState("");
  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [mensaje, setMensaje] = useState("");

  const solicitarPermisoNotificaciones = async () => {
    if ("Notification" in window) {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    solicitarPermisoNotificaciones();
  }, []);

const guardarIncidente = () => {
  if (
    fecha.trim() !== "" &&
    alumno.trim() !== "" &&
    tipo.trim() !== "" &&
    descripcion.trim() !== ""
  ) {
    setMensaje("Incidente registrado");

    // Simulación de envío a base de datos
    setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification("Sistema Escolar", {
          body: "El incidente fue enviado correctamente a la base de datos.",
          icon: "https://cdn-icons-png.flaticon.com/512/1827/1827392.png",
        });
      }
    }, 1000);

  } else {
    setMensaje("Debe completar todos los campos");
  }
};
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-[#071b44] to-[#02122f] text-white flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-4 px-8 py-10">
            <div className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center">
              <Users size={28} />
            </div>

            <div>
              <h1 className="text-3xl font-bold leading-8">
                Escuela
                <br />
                Claudio Flores
              </h1>
            </div>
          </div>

          {/* Menu */}
          <div className="px-6 mt-6">
            <p className="text-gray-400 text-sm mb-5 uppercase tracking-wider">
              Menú
            </p>

            <nav className="flex flex-col gap-3">
              <SidebarItem icon={<Users size={22} />} text="Inicio" active />

              <SidebarItem
                icon={<AlertTriangle size={22} />}
                text="Incidentes"
              />

              <SidebarItem
                icon={<BarChart3 size={22} />}
                text="Reportes"
              />

              <SidebarItem
                icon={<Users size={22} />}
                text="Alumnos"
              />

              <SidebarItem
                icon={<Settings size={22} />}
                text="Configuración"
              />
            </nav>
          </div>
        </div>

        {/* Logout */}
        <div className="px-6 py-8 border-t border-white/10">
          <button className="flex items-center gap-3 text-lg hover:text-blue-300 transition">
            <LogOut size={22} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1">
        {/* Topbar */}
        <header className="h-24 bg-white shadow-sm flex items-center justify-between px-10">

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-200"></div>

            <div>
              <h3 className="font-semibold text-lg">San Martín</h3>
              <p className="text-gray-500">Inspector Jefe Supremo</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="p-7">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-[#071b44] mb-3">
              Registrar Incidente
            </h1>

            <p className="text-gray-500 text-xl">
              Complete la información del incidente ocurrido.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-md p-10">
            {/* Fecha */}
            <div className="mb-8">
              <label className="block text-2xl font-semibold mb-4">
                Fecha del incidente
              </label>

              <div className="relative max-w-xl">
                <input
                  type="text"
                  placeholder="dd/mm/aaaa"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-blue-500"
                />

                <CalendarDays
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500"
                  size={28}
                />
              </div>
            </div>

            {/* Alumno */}
            <div className="mb-8">
              <label className="block text-2xl font-semibold mb-4">
                Nombre del alumno involucrado
              </label>

              <input
                type="text"
                placeholder="Ingrese el nombre completo del alumno"
                value={alumno}
                onChange={(e) => setAlumno(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-blue-500"
              />
            </div>

            {/* Tipo */}
            <div className="mb-8">
              <label className="block text-2xl font-semibold mb-4">
                Tipo de incidente
              </label>

              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-500 outline-none focus:border-blue-500"
              >
                <option>Seleccione el tipo de incidente</option>
                <option>Conducta</option>
                <option>Violencia</option>
                <option>Falta de respeto</option>
                <option>Daño a propiedad</option>
              </select>
            </div>

            {/* Descripción */}
            <div className="mb-10">
              <label className="block text-2xl font-semibold mb-4">
                Descripción del incidente
              </label>

              <textarea
                rows="6"
                placeholder="Describa detalladamente lo ocurrido"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base outline-none resize-none focus:border-blue-500"
              ></textarea>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-5">
              <button className="px-10 py-4 rounded-xl border border-gray-300 text-xl font-semibold hover:bg-gray-100 transition">
                Cancelar
              </button>

              <button
                onClick={guardarIncidente}
                className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold flex items-center gap-3 transition"
              >
                <Save size={24} />
                Guardar incidente
              </button>
            </div>
            {mensaje && (
              <p
                className={`mt-5 text-center font-semibold text-lg ${
                  mensaje === "Incidente registrado"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {mensaje}
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}