import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  taxRate: parseFloat(process.env.TAX_RATE || '8'),
  wsPath: process.env.WS_PATH || '/ws',
};
