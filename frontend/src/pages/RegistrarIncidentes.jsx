import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import { listarIncidentes, crearIncidente } from '../api/incidentes';
import { listarAlumnos } from '../api/alumnos';
import {CATEGORIAS, UBICACIONES, GRAVEDADES, GRAVEDAD_LABEL, GRAVEDAD_COLOR,} from '../constants/incidentes';

registerLocale('es', es);

export default function Incidentes() {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [alumnos, setAlumnos] = useState([]);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(true);
  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState([]);

  useEffect(() => {
    listarAlumnos()
      .then(setAlumnos)
      .finally(() => setCargandoAlumnos(false));
  }, []);

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    gravedad: '',
    ubicacion: '',
    fecha_incidente: '',
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

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
        alumno_ids: alumnosSeleccionados.map(a => a.id),
      });
      setForm({
        titulo: '',
        descripcion: '',
        categoria: '',
        gravedad: '',
        ubicacion: '',
        fecha_incidente: '',
      });
      await cargarIncidentes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el incidente');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#071b44' }}>Registre el Incidente</h2>
      </div>

      {/* Formulario */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={{ marginBottom: '1rem', fontWeight: '600', color: '#071b44' }}>Llene el siguiente formulario</h3>

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
            {busquedaAlumno && !cargandoAlumnos && (
              <div style={styles.sugerencias}>
                {alumnos
                  .filter(
                    (a) => {
                      const nombreCompleto = `${a.nombre} ${a.apellido}`;
                      return (
                        nombreCompleto.toLowerCase().includes(busquedaAlumno.toLowerCase()) &&
                        !alumnosSeleccionados.some((s) => s.id === a.id)
                      );
                    }
                  )
                  .map((alumno) => (
                    <div
                      key={alumno.id}
                      style={styles.sugerenciaItem}
                      onClick={() => {
                        setAlumnosSeleccionados([
                          ...alumnosSeleccionados,
                          alumno,
                        ]);
                        setBusquedaAlumno('');
                      }}
                    >
                      {alumno.nombre} {alumno.apellido}
                    </div>
                  ))}
              </div>
            )}

            {/* Seleccionados */}
            <div style={styles.tagsContainer}>
              {alumnosSeleccionados.map((alumno) => (
                <div key={alumno.id} style={styles.tag}>
                  {alumno.nombre} {alumno.apellido}

                  <button
                    type="button"
                    style={styles.tagButton}
                    onClick={() =>
                      setAlumnosSeleccionados(
                        alumnosSeleccionados.filter(
                          (a) => a.id !== alumno.id
                        )
                      )
                    }
                  >
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
