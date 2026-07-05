import jwt, { type SignOptions } from 'jsonwebtoken';
import { AppRole } from '@prisma/client';
import { config } from '../config';

export interface AuthTokenPayload {
  userId: string;
  role: AppRole;
  employeeId: string | null;
  displayName: string;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, config.jwtSecret, options);
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}
