import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { Activity, ActivityType } from '@inmoflow/shared';

export interface CreateActivityInput {
  agencyId: string;
  leadId: string;
  type: ActivityType;
  content?: string;
  createdBy?: string;
}

export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const result = await query(
    `INSERT INTO activities (id, agency_id, lead_id, type, content, created_by, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [id, input.agencyId, input.leadId, input.type, input.content || null, input.createdBy || null, now]
  );
  return mapActivity(result.rows[0]);
}

export async function listActivities(agencyId: string, leadId: string): Promise<Activity[]> {
  const result = await query(
    `SELECT * FROM activities WHERE agency_id = $1 AND lead_id = $2 ORDER BY created_at DESC LIMIT 100`,
    [agencyId, leadId]
  );
  return result.rows.map(mapActivity);
}

function mapActivity(row: any): Activity {
  return {
    id: row.id,
    agencyId: row.agency_id,
    leadId: row.lead_id,
    type: row.type,
    content: row.content,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}