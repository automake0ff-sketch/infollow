import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import * as visitService from '../services/visitService';

const router = Router();
router.use(authMiddleware);

const createVisitSchema = z.object({
  leadId: z.string().uuid(),
  propertyId: z.string().uuid().optional(),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const data = createVisitSchema.parse(req.body);
    const visit = await visitService.createVisit({ ...data, agencyId: req.user!.agencyId });
    res.status(201).json(visit);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req: AuthenticatedRequest, res) => {
  const filters = {
    leadId: req.query.leadId as string,
    propertyId: req.query.propertyId as string,
    status: req.query.status as any,
    from: req.query.from as string,
    to: req.query.to as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
  };
  const visits = await visitService.listVisits(req.user!.agencyId, filters);
  res.json(visits);
});

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  const visit = await visitService.findVisitById(req.user!.agencyId, req.params.id);
  if (!visit) return res.status(404).json({ error: 'Visita no encontrada' });
  res.json(visit);
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const visit = await visitService.updateVisit(req.user!.agencyId, req.params.id, req.body);
    res.json(visit);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/complete', async (req: AuthenticatedRequest, res) => {
  try {
    const visit = await visitService.completeVisit(req.user!.agencyId, req.params.id, req.body.result || undefined);
    res.json(visit);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;