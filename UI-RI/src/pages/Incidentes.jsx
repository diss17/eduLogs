import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import { listarIncidentes, crearIncidente } from '../api/incidentes';

registerLocale('es', es);

const CATEGORIAS = ['bullying', 'violencia', 'inasistencia', 'otro'];
const UBICACIONES = [
  'Patio principal',
  'Sala de clases',
  'Casino',
  'Biblioteca',
  'Gimnasio',
  'Pasillo',
  'Baños',
  'Entrada',
];
/*Esto es por mientras, que ni intente conectarme a la base de datos*/
const ALUMNOS = [
  'Juan Pérez',
  'María González',
  'Carlos Soto',
  'Fernanda Rojas',
  'Diego Muñoz',
  'Valentina Silva',
  'Tomás Herrera',
  'Camila Torres',
];

const GRAVEDADES = [
  'leve',
  'media',
  'grave',
  'muy grave',
];

const GRAVEDAD_LABEL = {
  leve: 'Leve',
  media: 'Media',
  grave: 'Grave',
  'muy grave': 'Muy grave',
};

const GRAVEDAD_COLOR = {
  leve: '#16a34a',
  media: '#d97706',
  grave: '#dc2626',
  'muy grave': '#7f1d1d',
};

export default function Incidentes() {
  const [incidentes, setIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState([]);

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    gravedad: '',
    ubicacion: '',
    fecha_incidente: '',
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    cargarIncidentes();
  }, []);

  async function cargarIncidentes() {
    try {
      const data = await listarIncidentes();
      setIncidentes(data);
    } catch {
      setError('No se pudieron cargar los incidentes.');
    } finally {
      setCargando(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');

    if (alumnosSeleccionados.length === 0) {
      setError('Debes seleccionar al menos un alumno involucrado.');
      setEnviando(false);
      return;
}

    try {
      await crearIncidente({
        ...form,
        funcionario_id: user.id,
        alumno_ids: [],
      });
      setForm({
        titulo: '',
        descripcion: '',
        categoria: '',
        gravedad: '',
        ubicacion: '',
        fecha_incidente: '',
      });
      setMostrarForm(false);
      await cargarIncidentes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el incidente');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#071b44' }}>Incidentes</h2>
        <button onClick={() => setMostrarForm(!mostrarForm)} style={styles.btnPrimary}>
          {mostrarForm ? 'Cancelar' : '+ Nuevo incidente'}
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={{ marginBottom: '1rem', fontWeight: '600', color: '#071b44' }}>Registrar incidente</h3>

          <div style={styles.grid2}>
            <label style={styles.label}>
              Título
              <input name="titulo" value={form.titulo} onChange={handleChange} required style={styles.input} placeholder="Ej. Conflicto en patio" />
            </label>
            <label style={styles.label}>
              Ubicación
              <select
                name="ubicacion"
                value={form.ubicacion}
                onChange={handleChange}
                required
                style={styles.input}
              >

                <option value="" disabled hidden>
                  Seleccione una ubicación
                </option>

                {UBICACIONES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label style={styles.label}>
            Alumnos involucrados

            <input
              type="text"
              value={busquedaAlumno}
              onChange={(e) => setBusquedaAlumno(e.target.value)}
              placeholder="Buscar alumno..."
              style={styles.input}
            />

            {/* Sugerencias */}
            {busquedaAlumno && (
              <div style={styles.sugerencias}>
                {ALUMNOS
                  .filter(
                    (a) =>
                      a.toLowerCase().includes(busquedaAlumno.toLowerCase()) &&
                      !alumnosSeleccionados.includes(a)
                  )
                  .map((alumno) => (
                    <div
                      key={alumno}
                      style={styles.sugerenciaItem}
                      onClick={() => {
                        setAlumnosSeleccionados([
                          ...alumnosSeleccionados,
                          alumno,
                        ]);
                        setBusquedaAlumno('');
                      }}
                    >
                      {alumno}
                    </div>
                  ))}
              </div>
            )}

            {/* Seleccionados */}
            <div style={styles.tagsContainer}>
              {alumnosSeleccionados.map((alumno) => (
                <div key={alumno} style={styles.tag}>
                  {alumno}

                  <button
                    type="button"
                    style={styles.tagButton}
                    onClick={() =>
                      setAlumnosSeleccionados(
                        alumnosSeleccionados.filter(
                          (a) => a !== alumno
                        )
                      )
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </label>          

          <label style={styles.label}>
            Descripción
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} required style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} placeholder="Describe el incidente..." />
          </label>

          <div style={styles.grid3}>

            <label style={styles.label}>
              Categoría
              <select
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                required
                style={styles.input}
              >

                <option value="" disabled>
                  Seleccionar categoría
                </option>

                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Gravedad
              <select
                name="gravedad"
                value={form.gravedad}
                onChange={handleChange}
                required
                style={styles.input}
                required
              >

                <option value="" disabled>
                  Seleccionar nivel de gravedad
                </option>

                {GRAVEDADES.map((g) => (
                  <option key={g} value={g}>
                    {GRAVEDAD_LABEL[g]}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Fecha del incidente

              <DatePicker
                selected={
                  form.fecha_incidente
                    ? new Date(form.fecha_incidente)
                    : null
                }
                onChange={(date) =>
                  setForm({
                    ...form,
                    fecha_incidente: date
                      ? date.toISOString().split('T')[0]
                      : '',
                  })
                }
                dateFormat="dd/MM/yyyy"
                placeholderText="Seleccione fecha"
                minDate={
                  new Date(
                    new Date().getFullYear(),
                    new Date().getMonth() - 1,
                    1
                  )
                }
                maxDate={new Date()}
                locale={es}
                required
                wrapperClassName="w-full"
                customInput={
                  <input style={styles.input} />
                }
              />

            </label>

          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={enviando} style={styles.btnPrimary}>
            {enviando ? 'Guardando…' : 'Guardar incidente'}
          </button>
        </form>
      )}

      {/* Lista */}
      {cargando ? (
        <p style={{ color: '#64748b' }}>Cargando incidentes…</p>
      ) : incidentes.length === 0 ? (
        <p style={{ color: '#64748b' }}>No hay incidentes registrados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {incidentes.map(inc => (
            <div key={inc.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontWeight: '600', color: '#071b44', marginBottom: '0.25rem' }}>{inc.titulo}</h4>
                  <p style={{ color: '#475569', fontSize: '0.9rem' }}>{inc.descripcion}</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    {inc.categoria} · {inc.ubicacion}
                  </p>
                </div>
                <span style={{ ...styles.badge, backgroundColor: GRAVEDAD_COLOR[inc.gravedad] + '20', color: GRAVEDAD_COLOR[inc.gravedad] }}>
                  {GRAVEDAD_LABEL[inc.gravedad]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  btnPrimary: {
    padding: '0.6rem 1.25rem',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  form: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  grid3: {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '1rem',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    fontSize: '0.9rem',
    color: '#334155',
    fontWeight: '500',
  },
  input: {
    padding: '0.7rem 0.9rem',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '0.95rem',
    color: '#0f172a',
    width: '100%',
    boxSizing: 'border-box',
  },
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
  },
  badge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  tag: {
  display: 'flex',
  alignItems: 'center',
  gap: '0.55rem',
  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  color: '#ffffff',
  padding: '0.45rem 0.9rem',
  borderRadius: '999px',
  fontSize: '0.85rem',
  fontWeight: '600',
  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
  },

  tagsContainer: {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: '0.6rem',
  marginTop: '0.9rem',
  },
tagButton: {
  border: 'none',
  background: 'rgba(255,255,255,0.2)',
  color: '#fff',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '700',
  fontSize: '0.85rem',
  padding: 0,
  },

  error: {
    padding: '0.75rem',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '0.9rem',
  },
};
