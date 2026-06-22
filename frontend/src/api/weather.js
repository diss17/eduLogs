const FALLBACK_LAT = parseFloat(import.meta.env.VITE_WEATHER_LAT ?? '-36.827');
const FALLBACK_LON = parseFloat(import.meta.env.VITE_WEATHER_LON ?? '-73.050');

const CODIGOS_CLIMA = {
  0: 'Cielo despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Niebla',
  48: 'Niebla helada',
  51: 'Llovizna ligera',
  53: 'Llovizna moderada',
  55: 'Llovizna densa',
  56: 'Llovizna helada ligera',
  57: 'Llovizna helada densa',
  61: 'Lluvia ligera',
  63: 'Lluvia moderada',
  65: 'Lluvia intensa',
  66: 'Lluvia helada ligera',
  67: 'Lluvia helada intensa',
  71: 'Nevada ligera',
  73: 'Nevada moderada',
  75: 'Nevada intensa',
  77: 'Granos de nieve',
  80: 'Chubascos ligeros',
  81: 'Chubascos moderados',
  82: 'Chubascos intensos',
  85: 'Chubascos de nieve ligeros',
  86: 'Chubascos de nieve intensos',
  95: 'Tormenta eléctrica',
  96: 'Tormenta con granizo ligero',
  99: 'Tormenta con granizo intenso',
};

function descripcionClima(codigo) {
  return CODIGOS_CLIMA[codigo] ?? 'Desconocido';
}

export async function obtenerClima(lat, lon) {
  const latitud = lat ?? FALLBACK_LAT;
  const longitud = lon ?? FALLBACK_LON;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitud}&longitude=${longitud}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`;

  try {
    const res = await fetch(url);
    if (!res.ok) return { error: 'Error al consultar clima' };

    const data = await res.json();
    const current = data.current;

    return {
      temperatura: Math.round(current.temperature_2m),
      humedad: current.relative_humidity_2m,
      descripcion: descripcionClima(current.weather_code),
      codigo: current.weather_code,
    };
  } catch {
    return { error: 'Error de conexión' };
  }
}
