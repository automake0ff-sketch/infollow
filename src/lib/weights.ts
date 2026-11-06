export const WEIGHTS = {
  overdue_task: ["Seguimiento vencido", 40],
  stalled_negotiation: ["Negociación sin actividad", 35],
  new_unattended: ["Lead nuevo sin atender", 30],
  stalled_interested: ["Interesado sin actividad", 25],
  compatible_property: ["Propiedad compatible sin asociar", 20],
  no_next_step: ["Sin próximo paso", 15],
  inactive: ["Inactividad general", 10],
} as const;
