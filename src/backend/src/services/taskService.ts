import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { Task, TaskStatus, TaskType } from '@inmoflow/shared';

export interface CreateTaskInput {
  agencyId: string;
  leadId: string;
  visitId?: string;
  title: string;
  description?: string;
  type?: TaskType;
  dueDate: string;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const result = await query(
    `INSERT INTO tasks (
      id, agency_id, lead_id, visit_id, title, description, type,
      status, due_date, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *`,
    [
      id, input.agencyId, input.leadId, input.visitId || null,
      input.title, input.description || null, input.type || 'follow_up',
      'pending', input.dueDate, now, now
    ]
  );
  return mapTask(result.rows[0]);
}

export async function findTaskById(agencyId: string, id: string): Promise<Task | null> {
  const result = await query(
    `SELECT * FROM tasks WHERE agency_id = $1 AND id = $2`,
    [agencyId, id]
  );
  return result.rows[0] ? mapTask(result.rows[0]) : null;
}

export async function listTasks(agencyId: string, filters: {
  leadId?: string;
  status?: TaskStatus;
  dueBefore?: string;
  dueAfter?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<Task[]> {
  const conditions: string[] = ['agency_id = $1'];
  const params: unknown[] = [agencyId];
  let idx = 2;

  if (filters.leadId) {
    conditions.push(`lead_id = $${idx}`);
    params.push(filters.leadId);
    idx++;
  }
  if (filters.status) {
    conditions.push(`status = $${idx}`);
    params.push(filters.status);
    idx++;
  }
  if (filters.dueBefore) {
    conditions.push(`due_date <= $${idx}`);
    params.push(filters.dueBefore);
    idx++;
  }
  if (filters.dueAfter) {
    conditions.push(`due_date >= $${idx}`);
    params.push(filters.dueAfter);
    idx++;
  }

  const where = conditions.join(' AND ');
  const sql = `SELECT * FROM tasks WHERE ${where} ORDER BY due_date ASC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(filters.limit || 100, filters.offset || 0);

  const result = await query(sql, params);
  return result.rows.map(mapTask);
}

export async function updateTask(agencyId: string, id: string, updates: Partial<CreateTaskInput & { status?: TaskStatus }>): Promise<Task> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    const col = key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
    fields.push(`${col} = $${idx}`);
    values.push(value);
    idx++;
  }

  if (updates.status === 'completed') {
    fields.push(`completed_at = $${idx}`);
    values.push(new Date().toISOString());
    idx++;
  }

  if (fields.length === 0) {
    const existing = await findTaskById(agencyId, id);
    if (!existing) throw new Error('Tarea no encontrada');
    return existing;
  }

  values.push(agencyId, id);
  const sql = `UPDATE tasks SET ${fields.join(', ')}, updated_at = now() WHERE agency_id = $${idx} AND id = $${idx + 1} RETURNING *`;
  const result = await query(sql, values);
  return mapTask(result.rows[0]);
}

export async function completeTask(agencyId: string, id: string): Promise<Task> {
  return updateTask(agencyId, id, { status: 'completed' });
}

export async function cancelTask(agencyId: string, id: string): Promise<Task> {
  return updateTask(agencyId, id, { status: 'cancelled' });
}

function mapTask(row: any): Task {
  return {
    id: row.id,
    agencyId: row.agency_id,
    leadId: row.lead_id,
    visitId: row.visit_id,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}