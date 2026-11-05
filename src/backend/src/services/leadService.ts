import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { Lead, LeadType, LeadStatus } from '@inmoflow/shared';

export interface CreateLeadInput {
  agencyId: string;
  name: string;
  phone?: string;
  email?: string;
  type?: LeadType;
  status?: LeadStatus;
  budget?: number;
  zone?: string;
  propertyType?: string;
  bedrooms?: number;
  preferences?: string;
  notes?: string;
  source?: string;
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const result = await query(
    `INSERT INTO leads (
      id, agency_id, name, phone, email, type, status, budget, zone,
      property_type, bedrooms, preferences, notes, source, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    RETURNING *`,
    [
      id, input.agencyId, input.name, input.phone || null, input.email || null,
      input.type || 'other', input.status || 'new', input.budget || null,
      input.zone || null, input.propertyType || null, input.bedrooms || null,
      input.preferences || null, input.notes || null, input.source || null,
      now, now
    ]
  );
  return mapLead(result.rows[0]);
}

export async function findLeadById(agencyId: string, id: string): Promise<Lead | null> {
  const result = await query(
    `SELECT * FROM leads WHERE agency_id = $1 AND id = $2`,
    [agencyId, id]
  );
  return result.rows[0] ? mapLead(result.rows[0]) : null;
}

export async function listLeads(agencyId: string, filters: {
  status?: LeadStatus;
  type?: LeadType;
  zone?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<Lead[]> {
  const conditions: string[] = ['agency_id = $1'];
  const params: unknown[] = [agencyId];
  let idx = 2;

  if (filters.status) {
    conditions.push(`status = $${idx}`);
    params.push(filters.status);
    idx++;
  }
  if (filters.type) {
    conditions.push(`type = $${idx}`);
    params.push(filters.type);
    idx++;
  }
  if (filters.zone) {
    conditions.push(`zone ILIKE $${idx}`);
    params.push(`%${filters.zone}%`);
    idx++;
  }
  if (filters.search) {
    conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx} OR phone ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }

  const where = conditions.join(' AND ');
  const sql = `SELECT * FROM leads WHERE ${where} ORDER BY updated_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(filters.limit || 100, filters.offset || 0);

  const result = await query(sql, params);
  return result.rows.map(mapLead);
}

export async function updateLead(agencyId: string, id: string, updates: Partial<CreateLeadInput>): Promise<Lead> {
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
    const existing = await findLeadById(agencyId, id);
    if (!existing) throw new Error('Lead no encontrado');
    return existing;
  }

  values.push(agencyId, id);
  const sql = `UPDATE leads SET ${fields.join(', ')}, updated_at = now() WHERE agency_id = $${idx} AND id = $${idx + 1} RETURNING *`;
  const result = await query(sql, values);
  return mapLead(result.rows[0]);
}

export async function deleteLead(agencyId: string, id: string): Promise<void> {
  await query(`DELETE FROM leads WHERE agency_id = $1 AND id = $2`, [agencyId, id]);
}

export async function updateLeadLastActivity(leadId: string, timestamp?: string): Promise<void> {
  const ts = timestamp || new Date().toISOString();
  await query(`UPDATE leads SET last_activity_at = $1, updated_at = now() WHERE id = $2`, [ts, leadId]);
}

function mapLead(row: any): Lead {
  return {
    id: row.id,
    agencyId: row.agency_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    type: row.type,
    status: row.status,
    budget: row.budget ? parseFloat(row.budget) : null,
    zone: row.zone,
    propertyType: row.property_type,
    bedrooms: row.bedrooms,
    preferences: row.preferences,
    notes: row.notes,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}