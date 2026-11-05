import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { Property } from '@inmoflow/shared';

export interface CreatePropertyInput {
  agencyId: string;
  reference: string;
  type: string;
  operation: 'sale' | 'rent';
  price: number;
  zone: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  surface?: number;
  description?: string;
  features?: string[];
  status?: 'available' | 'reserved' | 'sold' | 'rented';
}

export async function createProperty(input: CreatePropertyInput): Promise<Property> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const result = await query(
    `INSERT INTO properties (
      id, agency_id, reference, type, operation, price, zone, address,
      bedrooms, bathrooms, surface, description, features, status, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    RETURNING *`,
    [
      id, input.agencyId, input.reference, input.type, input.operation,
      input.price, input.zone, input.address || null,
      input.bedrooms || null, input.bathrooms || null, input.surface || null,
      input.description || null, input.features || null,
      input.status || 'available', now, now
    ]
  );
  return mapProperty(result.rows[0]);
}

export async function findPropertyById(agencyId: string, id: string): Promise<Property | null> {
  const result = await query(
    `SELECT * FROM properties WHERE agency_id = $1 AND id = $2`,
    [agencyId, id]
  );
  return result.rows[0] ? mapProperty(result.rows[0]) : null;
}

export async function listProperties(agencyId: string, filters: {
  operation?: 'sale' | 'rent';
  status?: string;
  zone?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<Property[]> {
  const conditions: string[] = ['agency_id = $1'];
  const params: unknown[] = [agencyId];
  let idx = 2;

  if (filters.operation) {
    conditions.push(`operation = $${idx}`);
    params.push(filters.operation);
    idx++;
  }
  if (filters.status) {
    conditions.push(`status = $${idx}`);
    params.push(filters.status);
    idx++;
  }
  if (filters.zone) {
    conditions.push(`zone ILIKE $${idx}`);
    params.push(`%${filters.zone}%`);
    idx++;
  }
  if (filters.search) {
    conditions.push(`(reference ILIKE $${idx} OR address ILIKE $${idx} OR description ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }

  const where = conditions.join(' AND ');
  const sql = `SELECT * FROM properties WHERE ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(filters.limit || 100, filters.offset || 0);

  const result = await query(sql, params);
  return result.rows.map(mapProperty);
}

export async function updateProperty(agencyId: string, id: string, updates: Partial<CreatePropertyInput>): Promise<Property> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    const col = key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
    fields.push(`${col} = $${idx}`);
    values.push(value);
    idx++;
  }

  if (fields.length === 0) {
    const existing = await findPropertyById(agencyId, id);
    if (!existing) throw new Error('Propiedad no encontrada');
    return existing;
  }

  values.push(agencyId, id);
  const sql = `UPDATE properties SET ${fields.join(', ')}, updated_at = now() WHERE agency_id = $${idx} AND id = $${idx + 1} RETURNING *`;
  const result = await query(sql, values);
  return mapProperty(result.rows[0]);
}

export async function deleteProperty(agencyId: string, id: string): Promise<void> {
  await query(`DELETE FROM properties WHERE agency_id = $1 AND id = $2`, [agencyId, id]);
}

function mapProperty(row: any): Property {
  return {
    id: row.id,
    agencyId: row.agency_id,
    reference: row.reference,
    type: row.type,
    operation: row.operation,
    price: parseFloat(row.price),
    zone: row.zone,
    address: row.address,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    surface: row.surface ? parseFloat(row.surface) : null,
    description: row.description,
    features: row.features,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}