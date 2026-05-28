import {
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./layouts/Dashboard";

export default function App() {

  return (

    <Routes>

      {/* Login */}
      <Route
        path="/"
        element={<Login />}
      />

      {/* Dashboard */}
      <Route
        path="/dashboard/*"
        element={<Dashboard />}
      />

    </Routes>

  );
}