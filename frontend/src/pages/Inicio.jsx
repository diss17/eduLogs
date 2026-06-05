export default function Inicio() {
  return (
    <div className="text-4xl font-bold text-[#071b44]">
      Hola, estas en Inicio
    </div>
  );
}
// import { useState, useEffect } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { registerLocale } from "react-datepicker";
// import { es } from "date-fns/locale";

// import {
//   CalendarDays,
//   Save,
// } from "lucide-react";

// registerLocale("es", es);

// export default function Inicio() {

//   const [fecha, setFecha] = useState(null);
//   const [alumno, setAlumno] = useState("");
//   const [tipo, setTipo] = useState("");
//   const [descripcion, setDescripcion] = useState("");
//   const [mensaje, setMensaje] = useState("");

//   const solicitarPermisoNotificaciones = async () => {
//     if ("Notification" in window) {
//       await Notification.requestPermission();
//     }
//   };

//   useEffect(() => {
//     solicitarPermisoNotificaciones();
//   }, []);

//   const guardarIncidente = () => {

//     if (
//       fecha !== null &&
//       alumno.trim() !== "" &&
//       tipo.trim() !== "" &&
//       descripcion.trim() !== ""
//     ) {

//       setMensaje("Incidente registrado");

//       setTimeout(() => {

//         if (Notification.permission === "granted") {

//           new Notification("Sistema Escolar", {
//             body: "El incidente fue enviado correctamente a la base de datos.",
//             icon: "https://cdn-icons-png.flaticon.com/512/1827/1827392.png",
//           });

//         }

//       }, 1000);

//     } else {

//       setMensaje("Debe completar todos los campos");

//     }
//   };

//   return (
//     <section>
//       <div className="mb-6">
//         <h1 className="text-4xl font-bold text-[#071b44] mb-2">
//           Registrar Incidente
//         </h1>

//         <p className="text-gray-500 text-lg">
//           Complete la información del incidente ocurrido.
//         </p>
//       </div>

//       <div className="bg-white rounded-2xl shadow-md p-7">

//         {/* Fecha */}
//         <div className="mb-6">

//           <label className="block text-lg font-semibold mb-3">
//             Fecha del incidente
//           </label>

//           <div className="relative max-w-xl">

//             <DatePicker
//               selected={fecha}
//               onChange={(date) => setFecha(date)}
//               dateFORMAT="dd/MM/yyyy"
//               placeholderText="Seleccione una fecha"
//               locale="es"
//               className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-blue-500"
//             />

//             <CalendarDays
//               className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
//               size={24}
//             />

//           </div>
//         </div>

//         {/* Alumno */}
//         <div className="mb-6">

//           <label className="block text-lg font-semibold mb-3">
//             Nombre del alumno involucrado
//           </label>

//           <input
//             type="text"
//             placeholder="Ingrese el nombre completo del alumno"
//             value={alumno}
//             onChange={(e) => setAlumno(e.target.value)}
//             className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-blue-500"
//           />

//         </div>

//         {/* Tipo */}
//         <div className="mb-6">

//           <label className="block text-lg font-semibold mb-3">
//             Tipo de incidente
//           </label>

//           <select
//             value={tipo}
//             onChange={(e) => setTipo(e.target.value)}
//             className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-500 outline-none focus:border-blue-500"
//           >

//             <option value="">
//               Seleccione el tipo de incidente
//             </option>

//             <option>Conducta</option>
//             <option>Violencia</option>
//             <option>Falta de respeto</option>
//             <option>Daño a propiedad</option>

//           </select>

//         </div>

//         {/* Descripción */}
//         <div className="mb-8">

//           <label className="block text-lg font-semibold mb-3">
//             Descripción del incidente
//           </label>

//           <textarea
//             rows="6"
//             placeholder="Describa detalladamente lo ocurrido"
//             value={descripcion}
//             onChange={(e) => setDescripcion(e.target.value)}
//             className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base outline-none resize-none focus:border-blue-500"
//           ></textarea>

//         </div>

//         {/* Botones */}
//         <div className="flex justify-end gap-4">

//           <button className="px-7 py-3 rounded-xl border border-gray-300 text-base font-semibold hover:bg-gray-100 transition">
//             Cancelar
//           </button>

//           <button
//             onClick={guardarIncidente}
//             className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold flex items-center gap-3 transition"
//           >

//             <Save size={20} />

//             Guardar incidente

//           </button>

//         </div>

//         {/* Mensaje */}
//         {mensaje && (

//           <p
//             className={`mt-5 text-center font-semibold text-lg ${
//               mensaje === "Incidente registrado"
//                 ? "text-green-600"
//                 : "text-red-600"
//             }`}
//           >

//             {mensaje}

//           </p>

//         )}

//       </div>
//     </section>
//   );
// }