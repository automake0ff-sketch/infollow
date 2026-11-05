import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import * as leadService from '../services/leadService';

const router = Router();
router.use(authMiddleware);

const createLeadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  type: z.enum(['buyer', 'seller', 'owner', 'tenant', 'other']).default('other'),
  status: z.enum(['new', 'contacted', 'interested', 'visit_pending', 'visit_done', 'negotiation', 'closed', 'not_interested']).default('new'),
  budget: z.number().optional(),
  zone: z.string().optional(),
  propertyType: z.string().optional(),
  bedrooms: z.number().optional(),
  preferences: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const data = createLeadSchema.parse(req.body);
    const lead = await leadService.createLead({ ...data, agencyId: req.user!.agencyId });
    res.status(201).json(lead);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req: AuthenticatedRequest, res) => {
  const filters = {
    status: req.query.status as any,
    type: req.query.type as any,
    zone: req.query.zone as string,
    search: req.query.search as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
  };
  const leads = await leadService.listLeads(req.user!.agencyId, filters);
  res.json(leads);
});

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  const lead = await leadService.findLeadById(req.user!.agencyId, req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead no encontrado' });
  res.json(lead);
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const lead = await leadService.updateLead(req.user!.agencyId, req.params.id, req.body);
    res.json(lead);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  await leadService.deleteLead(req.user!.agencyId, req.params.id);
  res.status(204).send();
});

export default router;