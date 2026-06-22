import { useEffect, useState } from "react";
import { listarAlumnos } from "../api/alumnos";
import { listarIncidentes } from "../api/incidentes";
import { obtenerClima } from "../api/weather";

function formatearFecha(date) {
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatearHora(date) {
  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function obtenerSaludo() {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 18) return "Buenas tardes";
  return "Buenas noches";
}

export default function Inicio() {
  const [ahora, setAhora] = useState(new Date());
  const [totalAlumnos, setTotalAlumnos] = useState(null);
  const [incidentesActivos, setIncidentesActivos] = useState(null);
  const [clima, setClima] = useState(null);

  const [ubicacionEstado, setUbicacionEstado] = useState(
    navigator.geolocation ? "pidiendo" : "denegada",
  );

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const nombre = user.nombre ?? "";

  useEffect(() => {
    const timer = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    listarAlumnos()
      .then((data) => setTotalAlumnos(data.length))
      .catch(() => setTotalAlumnos(0));
  }, []);

  useEffect(() => {
    listarIncidentes()
      .then((data) => {
        const activos = data.filter(
          (inc) => inc.estado === "abierto" || inc.estado === "en_progreso",
        ).length;
        setIncidentesActivos(activos);
      })
      .catch(() => setIncidentesActivos(0));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      obtenerClima().then(setClima);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacionEstado("lista");
        obtenerClima(pos.coords.latitude, pos.coords.longitude).then(setClima);
      },
      () => {
        setUbicacionEstado("denegada");
        obtenerClima().then(setClima);
      },
    );
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="page-card" style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "#071b44",
            margin: "0 0 0.5rem",
          }}
        >
          {obtenerSaludo()}
          {nombre ? `, ${nombre}` : ""} 👋
        </h1>
        <div
          style={{
            color: "#64748b",
            fontSize: "0.95rem",
            display: "flex",
            gap: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <span>📅 {formatearFecha(ahora)}</span>
          <span>🕐 {formatearHora(ahora)}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Alumnos */}
        <div className="page-card" style={{ padding: "1.25rem" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
              }}
            >
              👥
            </div>
            <div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                {totalAlumnos !== null ? totalAlumnos : "…"}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Alumnos
              </div>
            </div>
          </div>
        </div>

        {/* Incidentes Activos */}
        <div className="page-card" style={{ padding: "1.25rem" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
              }}
            >
              ⚠️
            </div>
            <div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                {incidentesActivos !== null ? incidentesActivos : "…"}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Incidentes activos
              </div>
            </div>
          </div>
        </div>

        {/* Clima */}
        <div className="page-card" style={{ padding: "1.25rem" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#fefce8",
                color: "#ca8a04",
                display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: "1.25rem",
              }}
            >
              🌤️
            </div>
            <div>
              {clima?.error ? (
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "#dc2626" }}>
                    {clima.error}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Clima</div>
                </div>
              ) : clima?.temperatura != null ? (
                <>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {clima.temperatura}°C
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#64748b",
                      textTransform: "capitalize",
                    }}
                  >
                    {clima.descripcion} · {clima.humedad}% HR
                  </div>
                </>
              ) : ubicacionEstado === "pidiendo" ? (
                <>
                  <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "#64748b" }}>
                    Obteniendo ubicación…
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    Clima
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "#64748b" }}>
                    {ubicacionEstado === "denegada"
                      ? "Ubicación denegada · mostrando clima local"
                      : "Cargando clima…"}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    Clima
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
