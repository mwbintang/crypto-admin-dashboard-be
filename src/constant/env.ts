import * as dotenv from 'dotenv';

dotenv.config(); // Load .env file

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

export const ENV = {
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  PORT: getEnvVar('PORT', '3000'),
};
