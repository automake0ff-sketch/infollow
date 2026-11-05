import { query } from './database';
import { User, Agency } from '@inmoflow/shared';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { logger } from './logger';

export interface AuthUser {
  id: string;
  agencyId: string;
  email: string;
  fullName: string;
  role: 'owner' | 'agent';
}

export async function createAgency(name: string): Promise<Agency> {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO agencies (id, name) VALUES ($1, $2) RETURNING *`,
    [id, name]
  );
  return result.rows[0];
}

export async function findAgencyByName(name: string): Promise<Agency | null> {
  const result = await query(
    `SELECT * FROM agencies WHERE name = $1`,
    [name]
  );
  return result.rows[0] || null;
}

export async function findAgencyById(id: string): Promise<Agency | null> {
  const result = await query(
    `SELECT * FROM agencies WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createUser(
  agencyId: string,
  email: string,
  password: string,
  fullName: string,
  role: 'owner' | 'agent' = 'owner'
): Promise<AuthUser> {
  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (id, agency_id, email, full_name, role, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, agency_id, email, full_name, role`,
    [id, agencyId, email, fullName, role, passwordHash]
  );
  return {
    id: result.rows[0].id,
    agencyId: result.rows[0].agency_id,
    email: result.rows[0].email,
    fullName: result.rows[0].full_name,
    role: result.rows[0].role,
  };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const result = await query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  if (result.rows.length === 0) return null;

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  return {
    id: user.id,
    agencyId: user.agency_id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
  };
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, agencyId: user.agencyId, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as any }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, env.jwtSecret) as any;
    return {
      id: payload.sub,
      agencyId: payload.agencyId,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
    };
  } catch (err) {
    logger.warn('Token verification failed:', err);
    return null;
  }
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  const result = await query(
    `SELECT id, agency_id, email, full_name, role FROM users WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  const u = result.rows[0];
  return {
    id: u.id,
    agencyId: u.agency_id,
    email: u.email,
    fullName: u.full_name,
    role: u.role,
  };
}

export async function listUsersByAgency(agencyId: string): Promise<AuthUser[]> {
  const result = await query(
    `SELECT id, agency_id, email, full_name, role FROM users WHERE agency_id = $1`,
    [agencyId]
  );
  return result.rows.map((u: any) => ({
    id: u.id,
    agencyId: u.agency_id,
    email: u.email,
    fullName: u.full_name,
    role: u.role,
  }));
}