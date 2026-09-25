import { APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '../../utils/logger';
import {  createSuccessResponse } from '../../utils/response';
import { withInterceptor } from '../../midddleware/interceptor';

const baseHandler = async (): Promise<APIGatewayProxyResult> => {
  const mensaje = "Ejecución Controller.peticionGet";
  logger.info(mensaje);
  
  return createSuccessResponse({ message: mensaje });
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware