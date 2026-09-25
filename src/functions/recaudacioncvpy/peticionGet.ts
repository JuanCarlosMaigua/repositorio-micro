// src/functions/recaudacioncvpy/peticionGet.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '../../utils/logger';
import { withInterceptor } from '../../midddleware/interceptor';

/**
 * Handler para peticionGet
 * Endpoint: GET /RecaudacionCvPY/peticionGet
 * 
 * Este endpoint es simplemente un health check que confirma
 * que el servicio está funcionando correctamente.
 */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info(`Request recibida en peticionGet`);
  
  // Mensaje de respuesta
  const mensaje = "Ejecucion Controller.peticionGet";
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': 'https://cajaverde.cuentafuturo.com/',
      'Access-Control-Allow-Credentials': 'true'
    },
    body: mensaje
  };
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware