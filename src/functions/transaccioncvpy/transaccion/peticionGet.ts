import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '../../../utils/logger';
import { createSuccessResponse } from '../../../utils/response';
import { withInterceptor } from '../../../midddleware/interceptor';

/**
 * Handler para el endpoint peticionGet
 * Un endpoint simple para verificar que el servicio está funcionando
 * @param event Evento de API Gateway
 * @returns Respuesta de API Gateway
 */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Procesando solicitud de peticionGet');
  
  const mensaje = "Ejecucion Controller.peticionGet: ";
  
  return createSuccessResponse(mensaje);
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware