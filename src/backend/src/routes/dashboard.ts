import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import * as alertService from '../services/alertService';

const router = Router();
router.use(authMiddleware);

router.get('/alerts/prioritized', async (req: AuthenticatedRequest, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const alerts = await alertService.listPrioritizedLeads(req.user!.agencyId, limit);
  res.json(alerts);
});

router.get('/alerts/overdue-count', async (req: AuthenticatedRequest, res) => {
  const result = await alertService.getOverdueTasksCount(req.user!.agencyId);
  res.json(result);
});

router.get('/alerts/today', async (req: AuthenticatedRequest, res) => {
  const result = await alertService.getTodayTasks(req.user!.agencyId);
  res.json(result);
});

export default router;