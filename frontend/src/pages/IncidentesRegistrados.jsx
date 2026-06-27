import { useEffect, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale';

import {
  listarIncidentes,
  actualizarIncidente,
  eliminarIncidente,
} from '../api/incidentes';
import { listarNotas, agregarNota } from '../api/notas';
import { listarJefaturas } from '../api/usuarios';
import {
  CATEGORIAS,
  UBICACIONES,
  GRAVEDADES,
  GRAVEDAD_LABEL,
  ESTADOS,
  ESTADO_LABEL,
} from '../constants/incidentes';

registerLocale('es', es);

function formatearFecha(fecha) {
  if (!fecha) return 'No registrada';

  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return fecha;

  return date.toLocaleDateString('es-CL');
}

function obtenerNombreRol(rol) {
  if (rol === 'admin' || rol === 'inspector') return 'Administrador';
  if (rol === 'profesor_jefe') return 'Profesor jefe';
  if (rol === 'profesor') return 'Profesor';
  return rol || 'Sin rol';
}

export default function IncidentesRegistrados() {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const puedeEditar = ['admin', 'inspector'].includes(user?.rol);
  const esProfesor = user?.rol === 'profesor';
  const esProfesorJefe = user?.rol === 'profesor_jefe';

  const [cursosJefe, setCursosJefe] = useState([]);

  const [incidentes, setIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [mostrarModalVisualizacion, setMostrarModalVisualizacion] = useState(false);
  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false);
  const [incidenteEditando, setIncidenteEditando] = useState(null);
  const [incidenteVisualizando, setIncidenteVisualizando] = useState(null);
  const [mensajeExito, setMensajeExito] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [eliminando, setEliminando] = useState(false);
  const [notas, setNotas] = useState([]);
  const [nuevaNota, setNuevaNota] = useState('');
  const [enviandoNota, setEnviandoNota] = useState(false);

  const puedeAgregarNota = ['inspector', 'profesor_jefe'].includes(user?.rol);

  useEffect(() => {
    cargarIncidentes();
  }, [categoriaFiltro]);

  useEffect(() => {
    if (esProfesorJefe && user?.id) {
      listarJefaturas(user.id)
        .then((jefaturas) => setCursosJefe(jefaturas.map((j) => j.grado)))
        .catch(() => {});
    }
  }, [esProfesorJefe, user?.id]);

  async function cargarIncidentes() {
    setCargando(true);
    try {
      const data = await listarIncidentes({ categoria: categoriaFiltro || undefined });
      setIncidentes(data);
    } finally {
      setCargando(false);
    }
  }

  function abrirEditor(incidente) {
    setIncidenteEditando({ ...incidente });
    setMostrarConfirmacionEliminar(false);
    setMostrarModalEdicion(true);
  }

  function cerrarEditor() {
    setMostrarConfirmacionEliminar(false);
    setMostrarModalEdicion(false);
    setIncidenteEditando(null);
  }

  function abrirVisualizacion(incidente) {
    setIncidenteVisualizando(incidente);
    setNotas([]);
    setNuevaNota('');
    setMostrarModalVisualizacion(true);
    listarNotas(incidente.id).then(setNotas).catch(() => {});
  }

  function cerrarVisualizacion() {
    setMostrarModalVisualizacion(false);
    setIncidenteVisualizando(null);
    setNotas([]);
    setNuevaNota('');
  }

  async function handleAgregarNota(e) {
    e.preventDefault();
    if (!nuevaNota.trim() || !incidenteVisualizando) return;
    setEnviandoNota(true);
    try {
      const nota = await agregarNota(incidenteVisualizando.id, nuevaNota.trim());
      setNotas((prev) => [...prev, nota]);
      setNuevaNota('');
    } finally {
      setEnviandoNota(false);
    }
  }

  async function guardarCambios() {
    try {
      await actualizarIncidente(incidenteEditando.id, {
        titulo: incidenteEditando.titulo,
        descripcion: incidenteEditando.descripcion,
        categoria: incidenteEditando.categoria,
        ubicacion: incidenteEditando.ubicacion,
        gravedad: incidenteEditando.gravedad,
        estado: incidenteEditando.estado,
        fecha_incidente: incidenteEditando.fecha_incidente,
        derivacion: incidenteEditando.derivacion || null,
      });

      await cargarIncidentes();
      cerrarEditor();

      setMensajeExito('Incidente actualizado correctamente');
      setTimeout(() => {
        setMensajeExito('');
      }, 3000);
    } catch (error) {
      console.error(error);
      alert('Error al actualizar incidente');
    }
  }

  async function confirmarEliminacion() {
    if (!incidenteEditando) return;

    setEliminando(true);

    try {
      await eliminarIncidente(incidenteEditando.id);
      cerrarEditor();
      window.alert('Incidente eliminado correctamente');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Error al eliminar incidente');
    } finally {
      setEliminando(false);
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

      {mensajeExito && (
        <div className="toast-success">
          {mensajeExito}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="edulogs-input"
          type="text"
          placeholder="Buscar por título, descripción o ubicación…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: '360px' }}
        />
        <select
          className="edulogs-input"
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          style={{ maxWidth: '220px' }}
        >
          <option value="">Todas las categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {(() => {
        const norm = (s) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        const q = norm(busqueda);
        const filtrados = busqueda
          ? incidentes.filter((inc) =>
              norm(inc.titulo).includes(q) ||
              norm(inc.descripcion).includes(q) ||
              norm(inc.ubicacion).includes(q)
            )
          : incidentes;

        if (cargando) return <p>Cargando incidentes...</p>;
        if (incidentes.length === 0) return <p>No hay incidentes registrados.</p>;
        if (filtrados.length === 0) return <p>Ningún incidente coincide con tu búsqueda.</p>;
        return (
          <div className="lista-incidentes">
            {filtrados.map((inc) => (
              <div
                key={inc.id}
                className="page-card"
                style={{
                  padding: '1.25rem',
                }}
              >
                <h3>{inc.titulo}</h3>

                <p>{inc.descripcion}</p>

                <small>
                  {inc.categoria} · {inc.ubicacion}
                </small>

                {inc.alumnos?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
                    {inc.alumnos.map((alumno) => (
                      <span
                        key={alumno.id}
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          background: '#eff6ff',
                          color: '#2563eb',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}
                      >
                        {alumno.nombre} {alumno.apellido}
                      </span>
                    ))}
                  </div>
                )}

                <div className="incident-card-actions">
                  {!esProfesor && !esProfesorJefe && (
                    <button
                      onClick={() => abrirVisualizacion(inc)}
                      className="edulogs-button-secondary"
                    >
                      Visualizar
                    </button>
                  )}
                  {esProfesorJefe && inc.alumnos?.some((a) => cursosJefe.includes(a.grado)) && (
                    <button
                      onClick={() => abrirVisualizacion(inc)}
                      className="edulogs-button-secondary"
                    >
                      Visualizar
                    </button>
                  )}

                  {puedeEditar && (
                    <button
                      onClick={() => abrirEditor(inc)}
                      className="edulogs-button"
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {mostrarModalVisualizacion && incidenteVisualizando && (
        <div className="modal-overlay">
          <div className="modal-card incident-view-card">
            <div className="incident-view-hero">
              <div className="incident-view-title-group">
                <span className="incident-view-eyebrow">Detalle del incidente</span>
                <h2 className="incident-view-title">
                  {incidenteVisualizando.titulo}
                </h2>
              </div>

              <div className="incident-view-students">
                <span className="incident-detail-label">Alumnos involucrados</span>
                {incidenteVisualizando.alumnos?.length ? (
                  <div className="incident-tags">
                    {incidenteVisualizando.alumnos.map((alumno) => (
                      <span key={alumno.id} className="incident-tag">
                        {alumno.nombre} {alumno.apellido} · {alumno.grado}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="incident-empty-text">No hay alumnos asociados.</p>
                )}
              </div>
            </div>

            <div className="incident-description-panel">
              <span className="incident-detail-label">Descripcion</span>
              <p>{incidenteVisualizando.descripcion}</p>
            </div>

            <div className="incident-detail-grid incident-detail-grid-compact">
              <div className="incident-detail-item">
                <span className="incident-detail-label">Categoria</span>
                <strong>{incidenteVisualizando.categoria}</strong>
              </div>

              <div className="incident-detail-item">
                <span className="incident-detail-label">Ubicacion</span>
                <strong>{incidenteVisualizando.ubicacion}</strong>
              </div>

              <div className="incident-detail-item">
                <span className="incident-detail-label">Gravedad</span>
                <strong>{GRAVEDAD_LABEL[incidenteVisualizando.gravedad] || 'No registrada'}</strong>
              </div>

              <div className="incident-detail-item">
                <span className="incident-detail-label">Estado</span>
                <strong>{incidenteVisualizando.estado || 'No registrado'}</strong>
              </div>

              <div className="incident-detail-item">
                <span className="incident-detail-label">Fecha del incidente</span>
                <strong>{formatearFecha(incidenteVisualizando.fecha_incidente)}</strong>
              </div>

              <div className="incident-detail-item">
                <span className="incident-detail-label">Responsable</span>
                <strong>
                  {incidenteVisualizando.funcionario
                    ? `${incidenteVisualizando.funcionario.nombre} ${incidenteVisualizando.funcionario.apellido}`
                    : 'No asignado'}
                </strong>
              </div>

              <div className="incident-detail-item">
                <span className="incident-detail-label">Creado el</span>
                <strong>{formatearFecha(incidenteVisualizando.created_at)}</strong>
              </div>

              <div className="incident-detail-item">
                <span className="incident-detail-label">Actualizado el</span>
                <strong>{formatearFecha(incidenteVisualizando.updated_at)}</strong>
              </div>
            </div>

            {incidenteVisualizando.derivacion && (
              <div style={{ marginTop: '1.25rem', background: '#fefce8', border: '1px solid #fde68a', borderRadius: '10px', padding: '1rem' }}>
                <span className="incident-detail-label" style={{ color: '#92400e' }}>Derivación</span>
                <p style={{ margin: '0.4rem 0 0', color: '#78350f', fontSize: '0.9rem' }}>
                  {incidenteVisualizando.derivacion}
                </p>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
              <span className="incident-detail-label">Notas</span>

              {notas.length === 0 ? (
                <p className="incident-empty-text">Sin notas aún.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.6rem' }}>
                  {notas.map((nota) => (
                    <div
                      key={nota.id}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                      }}
                    >
                      <p style={{ margin: '0 0 0.4rem', color: '#0f172a', fontSize: '0.9rem' }}>
                        {nota.contenido}
                      </p>
                      <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                        {nota.autor ? `${nota.autor.nombre} ${nota.autor.apellido}` : 'Desconocido'}
                        {' · '}
                        {formatearFecha(nota.created_at)}
                      </small>
                    </div>
                  ))}
                </div>
              )}

              {puedeAgregarNota && (
                <form onSubmit={handleAgregarNota} style={{ marginTop: '0.9rem', display: 'flex', gap: '0.5rem' }}>
                  <input
                    className="edulogs-input"
                    type="text"
                    placeholder="Escribir nota…"
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="submit"
                    className="edulogs-button"
                    disabled={enviandoNota || !nuevaNota.trim()}
                  >
                    {enviandoNota ? 'Guardando…' : 'Agregar'}
                  </button>
                </form>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="edulogs-button-secondary"
                onClick={cerrarVisualizacion}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalEdicion && incidenteEditando && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">
                Editar Incidente
              </h2>
              <p className="incident-role-caption">
                Disponible para: {obtenerNombreRol(user?.rol)}
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <input
                className="edulogs-input"
                placeholder="Titulo"
                value={incidenteEditando.titulo}
                onChange={(e) =>
                  setIncidenteEditando({
                    ...incidenteEditando,
                    titulo: e.target.value,
                  })
                }
              />

              <select
                className="edulogs-input"
                value={incidenteEditando.ubicacion || ''}
                onChange={(e) =>
                  setIncidenteEditando({
                    ...incidenteEditando,
                    ubicacion: e.target.value,
                  })
                }
              >
                {UBICACIONES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              className="edulogs-textarea"
              placeholder="Descripcion"
              value={incidenteEditando.descripcion}
              onChange={(e) =>
                setIncidenteEditando({
                  ...incidenteEditando,
                  descripcion: e.target.value,
                })
              }
              style={{
                minHeight: '120px',
              }}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: '1rem',
                marginTop: '1rem',
              }}
            >
              <select
                className="edulogs-input"
                value={incidenteEditando.categoria || ''}
                onChange={(e) =>
                  setIncidenteEditando({
                    ...incidenteEditando,
                    categoria: e.target.value,
                  })
                }
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                className="edulogs-input"
                value={incidenteEditando.gravedad || ''}
                onChange={(e) =>
                  setIncidenteEditando({
                    ...incidenteEditando,
                    gravedad: e.target.value,
                  })
                }
              >
                {GRAVEDADES.map((g) => (
                  <option key={g} value={g}>
                    {GRAVEDAD_LABEL[g]}
                  </option>
                ))}
              </select>

              <select
                className="edulogs-input"
                value={incidenteEditando.estado || ''}
                onChange={(e) =>
                  setIncidenteEditando({
                    ...incidenteEditando,
                    estado: e.target.value,
                  })
                }
              >
                {ESTADOS.map((s) => (
                  <option key={s} value={s}>
                    {ESTADO_LABEL[s]}
                  </option>
                ))}
              </select>

              <DatePicker
                selected={
                  incidenteEditando.fecha_incidente
                    ? new Date(incidenteEditando.fecha_incidente)
                    : null
                }
                onChange={(date) =>
                  setIncidenteEditando({
                    ...incidenteEditando,
                    fecha_incidente: date
                      ? date.toISOString().split('T')[0]
                      : '',
                  })
                }
                dateFormat="dd/MM/yyyy"
                locale={es}
                minDate={
                  new Date(
                    new Date().getFullYear(),
                    new Date().getMonth() - 1,
                    1
                  )
                }
                maxDate={new Date()}
                className="edulogs-input"
              />
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                Derivar
                <textarea
                  className="edulogs-textarea"
                  placeholder="Escribe aquí la derivación (ej: derivar a psicólogo, citación de apoderado…)"
                  value={incidenteEditando.derivacion || ''}
                  onChange={(e) => setIncidenteEditando({ ...incidenteEditando, derivacion: e.target.value })}
                  style={{ minHeight: '80px', resize: 'vertical', fontWeight: 400 }}
                />
              </label>
            </div>

            <div className="modal-actions modal-actions-split">
              <button
                className="edulogs-button-danger"
                onClick={() => setMostrarConfirmacionEliminar(true)}
              >
                Eliminar
              </button>

              <div className="modal-actions-group">
                <button
                  className="edulogs-button-secondary"
                  onClick={cerrarEditor}
                >
                  Cancelar
                </button>

                <button
                  className="edulogs-button"
                  onClick={guardarCambios}
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarConfirmacionEliminar && incidenteEditando && (
        <div className="modal-overlay">
          <div className="modal-card modal-card-confirmation">
            <div className="modal-header">
              <h2 className="modal-title">
                Eliminar incidente
              </h2>
            </div>

            <p className="modal-confirmation-text">
              ¿Estas seguro de querer eliminarlo?
            </p>

            <div className="modal-actions">
              <button
                className="edulogs-button-danger"
                onClick={confirmarEliminacion}
                disabled={eliminando}
              >
                {eliminando ? 'Eliminando...' : 'Si, eliminar'}
              </button>

              <button
                className="edulogs-button-secondary"
                onClick={() => setMostrarConfirmacionEliminar(false)}
                disabled={eliminando}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
