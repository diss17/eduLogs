import { useEffect, useState } from 'react';
import { listarIncidentes } from '../api/incidentes';

export default function IncidentesRegistrados() {

  const [incidentes, setIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarIncidentes();
  }, []);

  async function cargarIncidentes() {
    try {
      const data = await listarIncidentes();
      setIncidentes(data);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>

      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#071b44',
          marginBottom: '1.5rem',
        }}
      >
        Incidentes Registrados
      </h2>

      {cargando ? (
        <p>Cargando incidentes...</p>
      ) : incidentes.length === 0 ? (
        <p>No hay incidentes registrados.</p>
      ) : (
        <div className="lista-incidentes">

          {incidentes.map((inc) => (
            <div
              key={inc.id}
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem',
              }}
            >
              <h3>{inc.titulo}</h3>

              <p>{inc.descripcion}</p>

              <small>
                {inc.categoria} · {inc.ubicacion}
              </small>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}