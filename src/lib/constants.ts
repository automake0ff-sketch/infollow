export const LEAD_TYPES = {
  comprador: "Comprador",
  vendedor: "Vendedor",
  propietario: "Propietario",
  arrendatario: "Arrendatario",
  otro: "Otro",
} as const;

export const OPERATIONS = { venta: "Venta", alquiler: "Alquiler" } as const;

export const PROPERTY_STATUS = {
  disponible: "Disponible",
  reservada: "Reservada",
  vendida: "Vendida",
  alquilada: "Alquilada",
  retirada: "Retirada",
} as const;

export const ACTIVITY_LABELS = {
  nota: "Nota",
  llamada: "Llamada",
  mensaje: "Mensaje",
  email: "Email",
  visita: "Visita",
  cambio_estado: "Cambio de estado",
  otro: "Otro",
} as const;

// Tipos que el agente puede registrar a mano desde la ficha
export const MANUAL_ACTIVITY_TYPES = ["nota", "llamada", "mensaje", "email", "otro"] as const;

export const keys = <T extends object>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];
