import dotenv from 'dotenv';
dotenv.config();

import { createAgency, createUser, findAgencyByName } from './services/authService';
import { query } from './config/database';

async function seed() {
  console.log('Inicializando base de datos...');
  
  const agencyName = 'Inmobiliaria Demo';
  let agency = await findAgencyByName(agencyName);
  if (!agency) {
    agency = await createAgency(agencyName);
    console.log(`Agencia creada: ${agency.name} (${agency.id})`);
  }

  const email = 'demo@inmofollow.ai';
  const password = 'Demo1234!';
  const fullName = 'Agente Demo';

  const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length === 0) {
    await createUser(agency.id, email, password, fullName, 'owner');
    console.log(`Usuario demo creado: ${email}`);
  }

  console.log('Seed completado.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});