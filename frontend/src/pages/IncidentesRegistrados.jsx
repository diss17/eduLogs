import { useEffect, useState } from 'react';
import { listarIncidentes, actualizarIncidente } from '../api/incidentes';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import {CATEGORIAS, UBICACIONES, GRAVEDADES, GRAVEDAD_LABEL, GRAVEDAD_COLOR,} from '../constants/incidentes';

registerLocale('es', es);

export default function IncidentesRegistrados() {

  const [incidentes, setIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [incidenteEditando, setIncidenteEditando] = useState(null);
  const [mensajeExito, setMensajeExito] = useState('');
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

  function abrirEditor(incidente) {
  setIncidenteEditando({ ...incidente });
  setMostrarModal(true);
  }

  async function guardarCambios() {
    try {

      await actualizarIncidente(
        incidenteEditando.id,
        {
          titulo: incidenteEditando.titulo,
          descripcion: incidenteEditando.descripcion,
          categoria: incidenteEditando.categoria,
          ubicacion: incidenteEditando.ubicacion,
          gravedad: incidenteEditando.gravedad,
          fecha_incidente: incidenteEditando.fecha_incidente,
        }
      );

      await cargarIncidentes();

      setMostrarModal(false);

      setMensajeExito('✅ Incidente actualizado correctamente')

      setTimeout(() => {
        setMensajeExito('');
      }, 3000);

    } catch (error) {
      console.error(error);
      alert('Error al actualizar incidente');
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

      {cargando ? (
        <p>Cargando incidentes...</p>
      ) : incidentes.length === 0 ? (
        <p>No hay incidentes registrados.</p>
      ) : (
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
              <div
                style={{
                  marginTop: '1rem',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  paddingRight: '0.5rem',
                }}
              >
                <button
                  onClick={() => abrirEditor(inc)}
                  className="edulogs-button"
                >
                  Editar
                </button>
              </div>              

            </div>
          ))}

        </div>
      )}
      {mostrarModal && incidenteEditando && (
        <div className="modal-overlay">

          <div className="modal-card">

            <div className="modal-header">
              <h2 className="modal-title">
                Editar Incidente
              </h2>
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
                placeholder="Título"
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
              placeholder="Descripción"
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

            <div style={{ marginTop: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#071b44',
                }}
              >
                Antecedentes nuevos
              </label>

              <textarea
                className="edulogs-textarea"
                placeholder="Ingrese nuevos antecedentes del incidente..."
                value={incidenteEditando.antecedentes || ''}
                onChange={(e) =>
                  setIncidenteEditando({
                    ...incidenteEditando,
                    antecedentes: e.target.value,
                  })
                }
                style={{
                  minHeight: '100px',
                }}
              />
            </div>

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

            <div className="modal-actions">

              <button
                className="edulogs-button-secondary"
                onClick={() => setMostrarModal(false)}
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
      )}
    </div>
  );
}