import { useEffect, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale';

import {
  listarIncidentes,
  actualizarIncidente,
  eliminarIncidente,
} from '../api/incidentes';
import {
  CATEGORIAS,
  UBICACIONES,
  GRAVEDADES,
  GRAVEDAD_LABEL,
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
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const puedeEditar = ['admin', 'inspector'].includes(user?.rol);

  const [incidentes, setIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [mostrarModalVisualizacion, setMostrarModalVisualizacion] = useState(false);
  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false);
  const [incidenteEditando, setIncidenteEditando] = useState(null);
  const [incidenteVisualizando, setIncidenteVisualizando] = useState(null);
  const [mensajeExito, setMensajeExito] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    cargarIncidentes();
  }, [categoriaFiltro]);

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
    setMostrarModalVisualizacion(true);
  }

  function cerrarVisualizacion() {
    setMostrarModalVisualizacion(false);
    setIncidenteVisualizando(null);
  }

  async function guardarCambios() {
    try {
      await actualizarIncidente(incidenteEditando.id, {
        titulo: incidenteEditando.titulo,
        descripcion: incidenteEditando.descripcion,
        categoria: incidenteEditando.categoria,
        ubicacion: incidenteEditando.ubicacion,
        gravedad: incidenteEditando.gravedad,
        fecha_incidente: incidenteEditando.fecha_incidente,
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

      <div style={{ marginBottom: '1.5rem' }}>
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
        if (cargando) return <p>Cargando incidentes...</p>;
        if (incidentes.length === 0) return <p>No hay incidentes registrados.</p>;
        return (
          <div className="lista-incidentes">
            {incidentes.map((inc) => (
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

                <div className="incident-card-actions">
                  <button
                    onClick={() => abrirVisualizacion(inc)}
                    className="edulogs-button-secondary"
                  >
                    Visualizar
                  </button>

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
                gridTemplateColumns: '1fr 1fr 1fr',
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
