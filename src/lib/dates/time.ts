// Regla 3: el usuario ingresa inicio y fin; la duración se calcula
// automáticamente y soporta turnos que cruzan la medianoche
// (ej. 22:00 → 04:30 = 6 h 30 min).
export function calculateWorkedMinutes(
  startTime: string,
  endTime: string
): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  let minutes = endHour * 60 + endMin - (startHour * 60 + startMin);
  if (minutes < 0) {
    minutes += 24 * 60;
  }
  return minutes;
}

export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
