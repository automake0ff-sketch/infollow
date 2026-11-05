import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import * as taskService from '../services/taskService';

const router = Router();
router.use(authMiddleware);

const createTaskSchema = z.object({
  leadId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['follow_up', 'visit', 'call', 'message', 'other']).default('follow_up'),
  dueDate: z.string().datetime(),
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const task = await taskService.createTask({ ...data, agencyId: req.user!.agencyId });
    res.status(201).json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req: AuthenticatedRequest, res) => {
  const filters: any = {
    leadId: req.query.leadId as string,
    status: req.query.status as any,
    dueBefore: req.query.dueBefore as string,
    dueAfter: req.query.dueAfter as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
  };
  const tasks = await taskService.listTasks(req.user!.agencyId, filters);
  res.json(tasks);
});

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  const task = await taskService.findTaskById(req.user!.agencyId, req.params.id);
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
  res.json(task);
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const task = await taskService.updateTask(req.user!.agencyId, req.params.id, req.body);
    res.json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/complete', async (req: AuthenticatedRequest, res) => {
  try {
    const task = await taskService.completeTask(req.user!.agencyId, req.params.id);
    res.json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/cancel', async (req: AuthenticatedRequest, res) => {
  try {
    const task = await taskService.cancelTask(req.user!.agencyId, req.params.id);
    res.json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  await taskService.updateTask(req.user!.agencyId, req.params.id, { status: 'cancelled' });
  res.status(204).send();
});

export default router;