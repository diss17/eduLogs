import {
  AlertTriangle,
  BarChart3,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import SidebarItem from "./components/SidebarItem";

import Inicio from "./pages/Inicio";
import Incidentes from "./pages/Incidentes";
import Reportes from "./pages/Reportes";
import Alumnos from "./pages/Alumnos";
import Configuracion from "./pages/Configuracion";

export default function App() {

  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="w-60 bg-gradient-to-b from-[#071b44] to-[#02122f] text-white flex flex-col justify-between">

        <div>

          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-7">

            <div className="w-11 h-11 rounded-full border-2 border-white flex items-center justify-center">

              <Users size={22} />

            </div>

            <div>

              <h1 className="text-2xl font-bold leading-7">
                Escuela
                <br />
                Los Pinos
              </h1>

            </div>

          </div>

          {/* Menu */}
          <div className="px-4 mt-4">

            <p className="text-gray-400 text-sm mb-4 uppercase tracking-wider">
              Menú
            </p>

            <nav className="flex flex-col gap-2">

              <SidebarItem
                icon={<Users size={20} />}
                text="Inicio"
                to="/"
                active={location.pathname === "/"}
              />

              <SidebarItem
                icon={<AlertTriangle size={20} />}
                text="Incidentes"
                to="/incidentes"
                active={location.pathname === "/incidentes"}
              />

              <SidebarItem
                icon={<BarChart3 size={20} />}
                text="Reportes"
                to="/reportes"
                active={location.pathname === "/reportes"}
              />

              <SidebarItem
                icon={<Users size={20} />}
                text="Alumnos"
                to="/alumnos"
                active={location.pathname === "/alumnos"}
              />

              <SidebarItem
                icon={<Settings size={20} />}
                text="Configuración"
                to="/configuracion"
                active={location.pathname === "/configuracion"}
              />

            </nav>

          </div>

        </div>

        {/* Logout */}
        <div className="px-4 py-6 border-t border-white/10">

          <button className="flex items-center gap-3 text-base hover:text-blue-300 transition">

            <LogOut size={20} />

            Cerrar sesión

          </button>

        </div>

      </aside>

      {/* Main */}
      <main className="flex-1 p-8">

        <Routes>

          <Route
            path="/"
            element={<Inicio />}
          />

          <Route
            path="/incidentes"
            element={<Incidentes />}
          />

          <Route
            path="/reportes"
            element={<Reportes />}
          />

          <Route
            path="/alumnos"
            element={<Alumnos />}
          />

          <Route
            path="/configuracion"
            element={<Configuracion />}
          />

        </Routes>

      </main>

    </div>
  );
}