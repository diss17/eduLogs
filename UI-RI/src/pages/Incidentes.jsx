import { useState, useEffect } from 'react';
import { listarIncidentes, crearIncidente } from '../api/incidentes';

const CATEGORIAS = ['bullying', 'violencia', 'inasistencia', 'otro'];
const ESTADOS = ['abierto', 'en_progreso', 'cerrado'];

const ESTADO_LABEL = {
  abierto: 'Abierto',
  en_progreso: 'En progreso',
  cerrado: 'Cerrado',
};

const ESTADO_COLOR = {
  abierto: '#dc2626',
  en_progreso: '#d97706',
  cerrado: '#16a34a',
};

export default function Incidentes() {
  const [incidentes, setIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'otro',
    estado: 'abierto',
    ubicacion: '',
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

    try {
      await crearIncidente({
        ...form,
        funcionario_id: user.id,
        alumno_ids: [],
      });
      setForm({ titulo: '', descripcion: '', categoria: 'otro', estado: 'abierto', ubicacion: '' });
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
              <input name="ubicacion" value={form.ubicacion} onChange={handleChange} required style={styles.input} placeholder="Ej. Patio principal" />
            </label>
          </div>

          <label style={styles.label}>
            Descripción
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} required style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} placeholder="Describe el incidente..." />
          </label>

          <div style={styles.grid2}>
            <label style={styles.label}>
              Categoría
              <select name="categoria" value={form.categoria} onChange={handleChange} style={styles.input}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </label>
            <label style={styles.label}>
              Estado
              <select name="estado" value={form.estado} onChange={handleChange} style={styles.input}>
                {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABEL[e]}</option>)}
              </select>
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
                <span style={{ ...styles.badge, backgroundColor: ESTADO_COLOR[inc.estado] + '20', color: ESTADO_COLOR[inc.estado] }}>
                  {ESTADO_LABEL[inc.estado]}
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
  error: {
    padding: '0.75rem',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '0.9rem',
  },
};
