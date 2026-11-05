import { query } from '../config/database';
import { Lead } from '@inmoflow/shared';
import { logger } from '../config/logger';

export type PriorityLevel = 'high' | 'medium' | 'low';

export interface PriorityAlert {
  leadId: string;
  score: number;
  level: PriorityLevel;
  reason: string;
  type: string;
}

export async function calculateLeadPriority(agencyId: string, lead: Lead): Promise<PriorityAlert | null> {
  let score = 0;
  const reasons: string[] = [];

  const openStatuses: string[] = ['new', 'contacted', 'interested', 'visit_pending', 'negotiation'];
  const isOpen = openStatuses.includes(lead.status);

  if (isOpen) {
    if (lead.last_activity_at) {
      const daysSinceActivity = (Date.now() - new Date(lead.last_activity_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity > 7) {
        score += 30;
        reasons.push(`Sin actividad durante ${Math.floor(daysSinceActivity)} días`);
      }
    }
    if (lead.status === 'new') {
      score += 40;
      reasons.push('Nuevo lead sin atender');
    }
    if (lead.budget) {
      score += 10;
      reasons.push('Presupuesto definido');
    }
  }

  const overdueTasksResult = await query(
    `SELECT * FROM tasks WHERE agency_id = $1 AND lead_id = $2 AND status = 'pending' AND due_date < now() LIMIT 1`,
    [agencyId, lead.id]
  );
  if (overdueTasksResult.rows.length > 0) {
    score += 50;
    reasons.push('Tarea de seguimiento vencida');
  }

  const hasVisitDone = await query(
    `SELECT id FROM visits WHERE agency_id = $1 AND lead_id = $2 AND status = 'completed' LIMIT 1`,
    [agencyId, lead.id]
  );
  if (hasVisitDone.rows.length > 0) {
    score += 35;
    reasons.push('Visita realizada sin seguimiento posterior');
  }

  const hasPendingVisit = await query(
    `SELECT id FROM visits WHERE agency_id = $1 AND lead_id = $2 AND status = 'scheduled' LIMIT 1`,
    [agencyId, lead.id]
  );
  if (hasPendingVisit.rows.length > 0 && lead.status === 'visit_pending') {
    score += 25;
    reasons.push('Visita pendiente programada');
  }

  if (!isOpen) {
    return null;
  }

  const finalScore = Math.min(score, 100);
  const level: PriorityLevel = finalScore >= 60 ? 'high' : finalScore >= 30 ? 'medium' : 'low';

  if (finalScore > 0) {
    return {
      leadId: lead.id,
      score: finalScore,
      level,
      reason: reasons[0] || 'Oportunidad comercial abierta',
      type: 'priority_score',
    };
  }

  return null;
}

export async function listPrioritizedLeads(agencyId: string, limit = 20): Promise<PriorityAlert[]> {
  const leads = await query(
    `SELECT * FROM leads WHERE agency_id = $1 AND status IN ('new', 'contacted', 'interested', 'visit_pending', 'visit_done', 'negotiation') ORDER BY updated_at DESC LIMIT 50`,
    [agencyId]
  );
  const alerts: PriorityAlert[] = [];

  for (const lead of leads.rows) {
    const mappedLead: Lead = {
      id: lead.id,
      agencyId: lead.agency_id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      type: lead.type,
      status: lead.status,
      budget: lead.budget ? parseFloat(lead.budget) : null,
      zone: lead.zone,
      propertyType: lead.property_type,
      bedrooms: lead.bedrooms,
      preferences: lead.preferences,
      notes: lead.notes,
      source: lead.source,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
    };
    const alert = await calculateLeadPriority(agencyId, mappedLead);
    if (alert) {
      alerts.push(alert);
    }
  }

  alerts.sort((a, b) => b.score - a.score);
  return alerts.slice(0, limit);
}

export function getOverdueTasksCount(agencyId: string): Promise<{ count: number }> {
  const result = await query(
    `SELECT COUNT(*) FROM tasks WHERE agency_id = $1 AND status = 'pending' AND due_date < now()`,
    [agencyId]
  );
  return { count: parseInt(result.rows[0].count, 10) };
}

export function getTodayTasks(agencyId: string): Promise<{ tasks: any[] }> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const result = await query(
    `SELECT * FROM tasks WHERE agency_id = $1 AND status = 'pending' AND due_date >= $2 AND due_date < $3 ORDER BY due_date ASC`,
    [agencyId, todayStart.toISOString(), tomorrowStart.toISOString()]
  );
  return { tasks: result.rows };
}
