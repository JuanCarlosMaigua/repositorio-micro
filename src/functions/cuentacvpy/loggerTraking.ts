// src/functions/cuentacvpy/loggerTraking.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '../../utils/logger';
import { TrackingService } from '../../services/cuentacvpy/trackingService';
import { InMsgGenerarLogFrontEnd } from '../../models/cuentacvpy/inMsgGenerarLogFrontEnd';
import { createSuccessResponse, createErrorResponse } from '../../utils/response';
import { withInterceptor } from '../../midddleware/interceptor';

/**
 * Handler para loggerTraking
 * Endpoint: POST /CuentaCvPY/loggerTraking
 */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info(`Request recibida en loggerTraking`);
  
  try {
    // Validar que exista un cuerpo en la petición
    if (!event.body) {
      return createErrorResponse(
        '400', 
        'Cuerpo de la petición vacío', 
        'No se proporcionó cuerpo en la petición'
      );
    }
    
    // Parsear el cuerpo de la petición
    const mensajeEntrada: InMsgGenerarLogFrontEnd = JSON.parse(event.body);
    
    // Crear instancia del servicio
    const trackingService = new TrackingService();
    
    // Registrar el log
    const result = await trackingService.registrarLog(mensajeEntrada);
    
    // Retornar respuesta exitosa
    return createSuccessResponse(result);
  } catch (error) {
    logger.error('Error en loggerTraking handler', error);
    
    // Retornar respuesta de error
    return createErrorResponse();
  }
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware