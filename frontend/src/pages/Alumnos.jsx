import { useEffect, useState } from 'react';
import { listarAlumnos } from '../api/alumnos';

const AVATAR_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#ca8a04', '#16a34a', '#0891b2',
];

function getAvatarColor(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function getInitiales(nombre, apellido) {
  return (nombre?.charAt(0) ?? '') + (apellido?.charAt(0) ?? '');
}

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    listarAlumnos()
      .then(setAlumnos)
      .finally(() => setCargando(false));
  }, []);

  const filtrados = alumnos.filter((a) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      a.nombre.toLowerCase().includes(q) ||
      a.apellido.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.grado.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1 className="page-title">Alumnos</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <input
          className="edulogs-input"
          type="text"
          placeholder="Buscar por nombre, apellido, email o curso…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
        {!cargando && (
          <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
            {filtrados.length} de {alumnos.length} alumnos
          </span>
        )}
      </div>

      {(() => {
        if (cargando) {
          return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0', color: '#64748b' }}>
              Cargando alumnos…
            </div>
          );
        }

        if (alumnos.length === 0) {
          return (
            <div className="page-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
              <p style={{ fontSize: '1.1rem', margin: 0 }}>No hay alumnos registrados.</p>
            </div>
          );
        }

        if (filtrados.length === 0) {
          return (
            <div className="page-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
              <p style={{ fontSize: '1.1rem', margin: 0 }}>Ningún alumno coincide con tu búsqueda.</p>
            </div>
          );
        }

        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1rem',
          }}>
            {filtrados.map((alumno) => (
              <div key={alumno.id} className="page-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: getAvatarColor(alumno.id),
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  >
                    {getInitiales(alumno.nombre, alumno.apellido)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>
                      {alumno.nombre} {alumno.apellido}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {alumno.email}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {alumno.grado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
