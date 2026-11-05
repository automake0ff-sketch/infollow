import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { Visit, VisitStatus } from '@inmoflow/shared';

export interface CreateVisitInput {
  agencyId: string;
  leadId: string;
  propertyId?: string;
  scheduledAt: string;
  notes?: string;
}

export async function createVisit(input: CreateVisitInput): Promise<Visit> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const result = await query(
    `INSERT INTO visits (id, agency_id, lead_id, property_id, scheduled_at, status, notes, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [id, input.agencyId, input.leadId, input.propertyId || null, input.scheduledAt, 'scheduled', input.notes || null, now, now]
  );
  return mapVisit(result.rows[0]);
}

export async function findVisitById(agencyId: string, id: string): Promise<Visit | null> {
  const result = await query(
    `SELECT * FROM visits WHERE agency_id = $1 AND id = $2`,
    [agencyId, id]
  );
  return result.rows[0] ? mapVisit(result.rows[0]) : null;
}

export async function listVisits(agencyId: string, filters: {
  leadId?: string;
  propertyId?: string;
  status?: VisitStatus;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<Visit[]> {
  const conditions: string[] = ['agency_id = $1'];
  const params: unknown[] = [agencyId];
  let idx = 2;

  if (filters.leadId) {
    conditions.push(`lead_id = $${idx}`);
    params.push(filters.leadId);
    idx++;
  }
  if (filters.propertyId) {
    conditions.push(`property_id = $${idx}`);
    params.push(filters.propertyId);
    idx++;
  }
  if (filters.status) {
    conditions.push(`status = $${idx}`);
    params.push(filters.status);
    idx++;
  }
  if (filters.from) {
    conditions.push(`scheduled_at >= $${idx}`);
    params.push(filters.from);
    idx++;
  }
  if (filters.to) {
    conditions.push(`scheduled_at <= $${idx}`);
    params.push(filters.to);
    idx++;
  }

  const where = conditions.join(' AND ');
  const sql = `SELECT * FROM visits WHERE ${where} ORDER BY scheduled_at ASC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(filters.limit || 100, filters.offset || 0);

  const result = await query(sql, params);
  return result.rows.map(mapVisit);
}

export async function updateVisit(agencyId: string, id: string, updates: Partial<CreateVisitInput & { status?: VisitStatus; result?: string }>): Promise<Visit> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'result') {
      fields.push(`result = $${idx}`);
      values.push(value);
      idx++;
      continue;
    }
    const col = key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
    fields.push(`${col} = $${idx}`);
    values.push(value);
    idx++;
  }

  if (fields.length === 0) {
    const existing = await findVisitById(agencyId, id);
    if (!existing) throw new Error('Visita no encontrada');
    return existing;
  }

  values.push(agencyId, id);
  const sql = `UPDATE visits SET ${fields.join(', ')}, updated_at = now() WHERE agency_id = $${idx} AND id = $${idx + 1} RETURNING *`;
  const result = await query(sql, values);
  return mapVisit(result.rows[0]);
}

export async function completeVisit(agencyId: string, id: string, result?: string): Promise<Visit> {
  return updateVisit(agencyId, id, { status: 'completed', result });
}

function mapVisit(row: any): Visit {
  return {
    id: row.id,
    agencyId: row.agency_id,
    leadId: row.lead_id,
    propertyId: row.property_id,
    scheduledAt: row.scheduled_at,
    status: row.status,
    notes: row.notes,
    result: row.result,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}