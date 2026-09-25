import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '../utils/logger';
import { getRedisClient } from '../services/recaudacioncvpy/cache';
import { OutMsgObtenerCuenta } from '../models/cuentacvpy/outMsgObtenerCuenta';
import { Util, createErrorTokenResponse } from '../utils/response';

const MAX_REQUESTS = 2;
const WINDOW_SECONDS = 3600; // 1 hora

export type LambdaHandler = (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;

export function withInterceptor(handler: LambdaHandler): LambdaHandler {
  return async (event, context) => {
    const authHeader = event.headers['Authorization'] || event.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    const outMsg: OutMsgObtenerCuenta = {
      errorCode: Util.errCode,
      userMessage: Util.errMessage,
      systemMessage: Util.errMessage
    };

    if (token) {
      try {
        const redis = await getRedisClient();
        const path = event.path; // Este es el endpoint
        const key = `rate-limit:${token}:${path}`;
        const current = await redis.incr(key);
        
        if (current === 1) {
          await redis.expire(key, WINDOW_SECONDS); // Expira en 1 hora
        }

        const LIMIT_REQUESTS = Number(process.env.TOKEN_LIMIT || 8);
        if (current > LIMIT_REQUESTS) {
          outMsg.errorCode = '429';
          outMsg.userMessage = 'Límite de peticiones alcanzado para esta acción';
          outMsg.systemMessage = 'Límite de peticiones alcanzado para esta acción';
          return createErrorTokenResponse('429', outMsg.userMessage, outMsg.systemMessage);
        }

      } catch (err) {
        logger.error('Error en el interceptor', err);
        return createErrorTokenResponse('500', 'Error al verificar token', 'Error al verificar token');
      }
    }

    return await handler(event, context);
  };
}
