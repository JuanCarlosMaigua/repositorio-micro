import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createSuccessResponse, createErrorResponse } from '../../utils/response';
import { logger } from '../../utils/logger';
import { CompanyService } from '../../services/recaudacioncvpy/companyService';
import { closeRedisConnection } from '../../services/recaudacioncvpy/cache';
import { withInterceptor } from '../../midddleware/interceptor';

/**
 * Handler para consultarServicios
 * Endpoint: POST /RecaudacionCvPY/consultarServicios
 */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info(`Request recibida en consultarServicios`);
  
  try {
    // Crear instancia del servicio
    const companyService = new CompanyService();
    
    // Obtener la lista de servicios
    const result = await companyService.listServices(event.headers);
    
    // Retornar respuesta exitosa
    return createSuccessResponse(result);
  } catch (error) {
    // Loguear el error
    logger.error('Error en consultarServicios handler', error);
    
    // Retornar respuesta de error
    return createErrorResponse();
  } finally {
    // Cerrar conexión a Redis
    await closeRedisConnection();
  }
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware