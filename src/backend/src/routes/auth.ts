import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { createAgency, createUser, authenticateUser, findUserById, listUsersByAgency } from '../services/authService';
import { generateToken } from '../services/authService';
import { query } from '../config/database';
import { env } from '../config/env';

const router = Router();

const registerSchema = z.object({
  agencyName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const existingAgency = await query('SELECT * FROM agencies WHERE name = $1', [data.agencyName]);
    let agencyId: string;
    if (existingAgency.rows.length > 0) {
      agencyId = existingAgency.rows[0].id;
    } else {
      const agency = await createAgency(data.agencyName);
      agencyId = agency.id;
    }
    const user = await createUser(agencyId, data.email, data.password, data.fullName, 'owner');
    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err: any) {
    if (err.errors) return res.status(400).json({ error: 'Validación fallida', details: err.errors });
    res.status(400).json({ error: err.message });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await authenticateUser(data.email, data.password);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    const token = generateToken(user);
    res.json({ user, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const user = await findUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

router.get('/agency/users', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const users = await listUsersByAgency(req.user!.agencyId);
  res.json(users);
});

router.post('/invite', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const schema = z.object({ email: z.string().email(), fullName: z.string().min(2), role: z.enum(['agent', 'owner']).default('agent') });
    const data = schema.parse(req.body);
    const user = await createUser(req.user!.agencyId, data.email, 'temp-password-change-on-first-login', data.fullName, data.role);
    res.status(201).json({ message: 'Usuario invitado. Deberá cambiar la contraseña al iniciar sesión.', user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;