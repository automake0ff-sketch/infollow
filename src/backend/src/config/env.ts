import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Variable de entorno no definida: ${key}`);
  return value;
}

export const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  stripePriceProMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openAiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  aiDailyQuota: parseInt(process.env.AI_DAILY_QUOTA || '1000', 10),
  aiMaxContextTokens: parseInt(process.env.AI_MAX_CONTEXT_TOKENS || '4000', 10),
};
