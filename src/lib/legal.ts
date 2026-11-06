const pending = (what: string) => `[PENDIENTE: ${what}]`;

/** Datos del titular del servicio. Se configuran por variables de entorno; si faltan, se muestran como pendientes. */
export const LEGAL = {
  product: "INMO FOLLOW AI",
  name: process.env.NEXT_PUBLIC_LEGAL_NAME || pending("razón social o nombre del titular"),
  taxId: process.env.NEXT_PUBLIC_LEGAL_TAX_ID || pending("NIF/CIF"),
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || pending("domicilio"),
  email: process.env.NEXT_PUBLIC_LEGAL_EMAIL || pending("email de contacto para privacidad"),
  reviewed: process.env.NEXT_PUBLIC_LEGAL_REVIEWED === "true",
  version: "1",
  updated: "6 de noviembre de 2026",
};
