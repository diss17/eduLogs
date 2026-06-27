import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { listarAlumnos, obtenerIncidentesAlumno } from '../api/alumnos';
import { GRAVEDAD_LABEL, GRAVEDAD_COLOR } from '../constants/incidentes';

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

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString('es-CL');
}

const OPCIONES_ORDEN = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'apellido', label: 'Apellido' },
  { value: 'mas_anotaciones', label: 'Más anotaciones' },
  { value: 'menos_anotaciones', label: 'Menos anotaciones' },
];

function ordenarAlumnos(lista, orden) {
  return [...lista].sort((a, b) => {
    switch (orden) {
      case 'nombre': return a.nombre.localeCompare(b.nombre);
      case 'apellido': return a.apellido.localeCompare(b.apellido);
      case 'mas_anotaciones': return (b.num_incidentes ?? 0) - (a.num_incidentes ?? 0);
      case 'menos_anotaciones': return (a.num_incidentes ?? 0) - (b.num_incidentes ?? 0);
      default: return 0;
    }
  });
}

function agruparPorGrado(lista) {
  const mapa = new Map();
  for (const alumno of lista) {
    if (!mapa.has(alumno.grado)) mapa.set(alumno.grado, []);
    mapa.get(alumno.grado).push(alumno);
  }
  return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b));
}

const CATEGORIA_COLOR = {
  bullying:    { bg: '#fef2f2', color: '#dc2626' },
  violencia:   { bg: '#fff7ed', color: '#ea580c' },
  inasistencia:{ bg: '#fefce8', color: '#ca8a04' },
  otro:        { bg: '#f1f5f9', color: '#475569' },
};

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('nombre');
  const [colapsados, setColapsados] = useState(new Set());

  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [incidentesAlumno, setIncidentesAlumno] = useState([]);
  const [cargandoIncidentes, setCargandoIncidentes] = useState(false);

  useEffect(() => {
    listarAlumnos()
      .then(setAlumnos)
      .finally(() => setCargando(false));
  }, []);

  function abrirAlumno(alumno) {
    setAlumnoSeleccionado(alumno);
    setIncidentesAlumno([]);
    setCargandoIncidentes(true);
    obtenerIncidentesAlumno(alumno.id)
      .then(setIncidentesAlumno)
      .finally(() => setCargandoIncidentes(false));
  }

  function cerrarModal() {
    setAlumnoSeleccionado(null);
    setIncidentesAlumno([]);
  }

  const norm = (s) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const filtrados = ordenarAlumnos(
    alumnos.filter((a) => {
      if (!busqueda) return true;
      const q = norm(busqueda);
      return (
        norm(a.nombre).includes(q) ||
        norm(a.apellido).includes(q) ||
        norm(a.email).includes(q) ||
        norm(a.grado).includes(q)
      );
    }),
    orden,
  );

  const grupos = agruparPorGrado(filtrados);

  function toggleGrado(grado) {
    setColapsados((prev) => {
      const next = new Set(prev);
      if (next.has(grado)) {
        next.delete(grado);
      } else {
        next.add(grado);
      }
      return next;
    });
  }

  return (
    <div>
      <h1 className="page-title">Alumnos</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500, marginRight: '0.25rem' }}>
          Ordenar por:
        </span>
        {OPCIONES_ORDEN.map((op) => (
          <button
            key={op.value}
            onClick={() => setOrden(op.value)}
            style={{
              padding: '0.3rem 0.85rem',
              borderRadius: '999px',
              border: '1.5px solid',
              borderColor: orden === op.value ? '#2563eb' : '#cbd5e1',
              background: orden === op.value ? '#eff6ff' : '#fff',
              color: orden === op.value ? '#2563eb' : '#475569',
              fontWeight: orden === op.value ? 600 : 400,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {op.label}
          </button>
        ))}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {grupos.map(([grado, miembros]) => {
              const abierto = !colapsados.has(grado);
              return (
                <section key={grado}>
                  <button
                    onClick={() => toggleGrado(grado)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      padding: '0.5rem 0',
                      cursor: 'pointer',
                      marginBottom: abierto ? '0.75rem' : 0,
                    }}
                  >
                    {abierto
                      ? <ChevronDown size={18} color="#2563eb" />
                      : <ChevronRight size={18} color="#2563eb" />
                    }
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                      {grado}
                    </span>
                    <span style={{ padding: '0.15rem 0.6rem', borderRadius: '999px', background: '#eff6ff', color: '#2563eb', fontSize: '0.78rem', fontWeight: 600 }}>
                      {miembros.length} alumno{miembros.length === 1 ? '' : 's'}
                    </span>
                    <span style={{ flex: 1, height: 1, background: '#e2e8f0', marginLeft: '0.5rem' }} />
                  </button>

                  {abierto && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                      {miembros.map((alumno) => (
                        <div
                          key={alumno.id}
                          className="page-card"
                          onClick={() => abrirAlumno(alumno)}
                          style={{ padding: '1.25rem', cursor: 'pointer', transition: 'box-shadow 0.15s', }}
                          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.13)'}
                          onMouseLeave={(e) => e.currentTarget.style.boxShadow = ''}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: getAvatarColor(alumno.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 }}>
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
                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', background: alumno.num_incidentes > 0 ? '#fef3c7' : '#f1f5f9', color: alumno.num_incidentes > 0 ? '#92400e' : '#94a3b8', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {alumno.num_incidentes ?? 0} anotación{(alumno.num_incidentes ?? 0) === 1 ? '' : 'es'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        );
      })()}

      {/* Modal anotaciones */}
      {alumnoSeleccionado && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div
            className="modal-card"
            style={{ width: 700 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: getAvatarColor(alumnoSeleccionado.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                {getInitiales(alumnoSeleccionado.nombre, alumnoSeleccionado.apellido)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#0f172a' }}>
                  {alumnoSeleccionado.nombre} {alumnoSeleccionado.apellido}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  {alumnoSeleccionado.grado} · {alumnoSeleccionado.email}
                </div>
              </div>
              <button
                onClick={cerrarModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155', marginBottom: '0.75rem' }}>
              Anotaciones ({alumnoSeleccionado.num_incidentes ?? 0})
            </div>

            {cargandoIncidentes ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b' }}>Cargando…</div>
            ) : incidentesAlumno.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8' }}>
                Este alumno no tiene anotaciones registradas.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {incidentesAlumno.map((inc) => {
                  const cat = CATEGORIA_COLOR[inc.categoria] ?? CATEGORIA_COLOR.otro;
                  return (
                    <div key={inc.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>{inc.titulo}</span>
                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                          <span style={{ padding: '0.15rem 0.55rem', borderRadius: '999px', background: cat.bg, color: cat.color, fontSize: '0.75rem', fontWeight: 600 }}>
                            {inc.categoria}
                          </span>
                          {inc.gravedad && (
                            <span style={{ padding: '0.15rem 0.55rem', borderRadius: '999px', background: '#f1f5f9', color: GRAVEDAD_COLOR[inc.gravedad], fontSize: '0.75rem', fontWeight: 600 }}>
                              {GRAVEDAD_LABEL[inc.gravedad]}
                            </span>
                          )}
                        </div>
                      </div>
                      <p style={{ margin: '0 0 0.5rem', color: '#475569', fontSize: '0.875rem', lineHeight: 1.6 }}>
                        {inc.descripcion}
                      </p>
                      <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                        {inc.ubicacion} · {formatearFecha(inc.fecha_incidente)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="modal-actions">
              <button className="edulogs-button-secondary" onClick={cerrarModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
