/**
 * Días sin rueda en BYMA por feriados nacionales (Ley 27.399), solo los que caen de lunes a viernes.
 * Los trasladables ya están movidos: martes/miércoles → lunes anterior; jueves/viernes → lunes siguiente.
 * Incluye Jueves Santo (día no laborable en el que BYMA no opera). No incluye los días no laborables
 * con fines turísticos, que se decretan cada año: revisar y extender esta tabla anualmente.
 */
export const HOLIDAYS: Record<string, string> = {
  // 2026
  "2026-01-01": "Año Nuevo",
  "2026-02-16": "Carnaval",
  "2026-02-17": "Carnaval",
  "2026-03-24": "Día de la Memoria",
  "2026-04-02": "Malvinas y Jueves Santo",
  "2026-04-03": "Viernes Santo",
  "2026-05-01": "Día del Trabajador",
  "2026-05-25": "Revolución de Mayo",
  "2026-06-15": "Paso a la Inmortalidad de Güemes",
  "2026-07-09": "Día de la Independencia",
  "2026-08-17": "Paso a la Inmortalidad de San Martín",
  "2026-10-12": "Día de la Diversidad Cultural",
  "2026-11-23": "Día de la Soberanía Nacional",
  "2026-12-08": "Inmaculada Concepción",
  "2026-12-25": "Navidad",
  // 2027
  "2027-01-01": "Año Nuevo",
  "2027-02-08": "Carnaval",
  "2027-02-09": "Carnaval",
  "2027-03-24": "Día de la Memoria",
  "2027-03-25": "Jueves Santo",
  "2027-03-26": "Viernes Santo",
  "2027-04-02": "Día de Malvinas",
  "2027-05-25": "Revolución de Mayo",
  "2027-06-21": "Paso a la Inmortalidad de Güemes",
  "2027-07-09": "Día de la Independencia",
  "2027-08-16": "Paso a la Inmortalidad de San Martín",
  "2027-10-11": "Día de la Diversidad Cultural",
  "2027-12-08": "Inmaculada Concepción",
};
