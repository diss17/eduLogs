import {
  AlertTriangle,
  BarChart3,
  Users,
  LogOut,
} from "lucide-react";

import {
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";

import SidebarItem from "../components/SidebarItem";

import Inicio from "../pages/Inicio";
import RegistrarIncidentes from "../pages/RegistrarIncidentes";
import IncidentesRegistrados from "../pages/IncidentesRegistrados";
import Alumnos from "../pages/Alumnos";

export default function Dashboard() {

  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const esProfesor = user?.rol === 'profesor';
  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate("/");
  };

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
                to="/dashboard"
                active={location.pathname === "/dashboard"}
              />

              <SidebarItem
                icon={<AlertTriangle size={20} />}
                text="Registrar Incidente"
                to="/dashboard/registrar-incidente"
                active={location.pathname === "/dashboard/registrar-incidente"}
              />

              <SidebarItem
                icon={<BarChart3 size={20} />}
                text="Incidentes Registrados"
                to="/dashboard/incidentes-registrados"
                active={location.pathname === "/dashboard/incidentes-registrados"}
              />

              {!esProfesor && (
                <SidebarItem
                  icon={<Users size={20} />}
                  text="Alumnos"
                  to="/dashboard/alumnos"
                  active={location.pathname === "/dashboard/alumnos"}
                />
              )}

            </nav>

          </div>

        </div>

        {/* Logout */}
        <div className="px-4 py-6 border-t border-white/10">

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-base hover:text-blue-300 transition"
            >

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
            path="/registrar-incidente"
            element={<RegistrarIncidentes />}
          />

          <Route
            path="/incidentes-registrados"
            element={<IncidentesRegistrados />}
          />

          {!esProfesor && (
            <Route
              path="/alumnos"
              element={<Alumnos />}
            />
          )}

        </Routes>

      </main>

    </div>
  );
}