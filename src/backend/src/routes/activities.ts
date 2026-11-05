import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import * as activityService from '../services/activityService';

const router = Router();
router.use(authMiddleware);

router.get('/leads/:leadId/activities', async (req: AuthenticatedRequest, res) => {
  const activities = await activityService.listActivities(req.user!.agencyId, req.params.leadId);
  res.json(activities);
});

router.post('/leads/:leadId/activities', async (req: AuthenticatedRequest, res) => {
  try {
    const schema = z.object({
      type: z.enum(['call', 'message', 'email', 'note', 'system']),
      content: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const activity = await activityService.createActivity({
      ...data,
      agencyId: req.user!.agencyId,
      leadId: req.params.leadId,
      createdBy: req.user!.id,
    });
    res.status(201).json(activity);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;