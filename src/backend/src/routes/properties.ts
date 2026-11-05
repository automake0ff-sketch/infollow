import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import * as propertyService from '../services/propertyService';

const router = Router();
router.use(authMiddleware);

const createPropertySchema = z.object({
  reference: z.string().min(1),
  type: z.string().min(1),
  operation: z.enum(['sale', 'rent']),
  price: z.number().positive(),
  zone: z.string().min(1),
  address: z.string().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  surface: z.number().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  status: z.enum(['available', 'reserved', 'sold', 'rented']).default('available'),
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const data = createPropertySchema.parse(req.body);
    const property = await propertyService.createProperty({ ...data, agencyId: req.user!.agencyId });
    res.status(201).json(property);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req: AuthenticatedRequest, res) => {
  const filters = {
    operation: req.query.operation as any,
    status: req.query.status as string,
    zone: req.query.zone as string,
    search: req.query.search as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
  };
  const properties = await propertyService.listProperties(req.user!.agencyId, filters);
  res.json(properties);
});

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  const property = await propertyService.findPropertyById(req.user!.agencyId, req.params.id);
  if (!property) return res.status(404).json({ error: 'Propiedad no encontrada' });
  res.json(property);
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const property = await propertyService.updateProperty(req.user!.agencyId, req.params.id, req.body);
    res.json(property);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  await propertyService.deleteProperty(req.user!.agencyId, req.params.id);
  res.status(204).send();
});

export default router;