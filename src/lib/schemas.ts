import { z } from "zod";
import { LEAD_TYPES, OPERATIONS, PROPERTY_STATUS, MANUAL_ACTIVITY_TYPES, keys } from "./constants";

const optText = (max: number) => z.string().max(max).nullable();
const optNum = z.number().nonnegative().nullable();
const optInt = (max: number) => z.number().int().min(0).max(max).nullable();

export const leadSchema = z.object({
  full_name: z.string().min(1, "El nombre es obligatorio").max(120),
  phone: optText(30),
  email: z.string().email("Email no válido").max(160).nullable(),
  lead_type: z.enum(keys(LEAD_TYPES)),
  budget: optNum,
  zone: optText(120),
  property_type: optText(60),
  bedrooms: optInt(20),
  preferences: optText(2000),
  notes: optText(4000),
  source: optText(80),
});

export const propertySchema = z.object({
  reference: z.string().min(1, "La referencia es obligatoria").max(40),
  property_type: optText(60),
  operation: z.enum(keys(OPERATIONS)),
  price: optNum,
  address: optText(200),
  zone: optText(120),
  bedrooms: optInt(50),
  bathrooms: optInt(50),
  area_m2: optNum,
  description: optText(4000),
  features: z.array(z.string().max(60)).max(30),
  status: z.enum(keys(PROPERTY_STATUS)),
});

export const activitySchema = z.object({
  lead_id: z.string().uuid(),
  type: z.enum(MANUAL_ACTIVITY_TYPES),
  content: z.string().min(1, "Escribe algo para registrar").max(4000),
  property_id: z.string().uuid().nullable(),
});

export const uuid = z.string().uuid();
