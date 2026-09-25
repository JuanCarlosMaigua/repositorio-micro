import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '../../utils/logger';
import { ComprobanteService } from '../../services/comprobantecvpy/comprobanteService';
import { MensajeComprobante } from '../../models/comprobantecvpy/mensajeComprobante';
import { createSuccessResponse, createErrorResponse, Util } from '../../utils/response';
import { withInterceptor } from '../../midddleware/interceptor';

/**
 * Handler para generarComprobante
 * Endpoint: POST /ComprobanteCvPY/generarComprobante
 */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info(`Request recibida en generarComprobante`);
  
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
    const mensajeEntrada: MensajeComprobante = JSON.parse(event.body);
    
    // Crear instancia del servicio
    const comprobanteService = new ComprobanteService();
    for (const [key, value] of Object.entries(mensajeEntrada)) {
      if (typeof value === 'string') {
        const error = Util.validarString(value, key);
        if (error) {
          return createErrorResponse(
            '400', 
            'Validación de Datos', 
            error
          );
        }
      }
    }
    // Generar comprobante
    const resultado = await comprobanteService.guardarComprobante(mensajeEntrada);
    
    // Retornar respuesta exitosa
    return createSuccessResponse(resultado);
  } catch (error: any) {
    logger.error('Error en generarComprobante handler:', error);
    
    // Retornar respuesta de error
    return createErrorResponse(
      String(error.errorCode || '500'),
      error.userMessage || 'Error al procesar la solicitud',
      error.message || 'Error interno del servidor'
    );
  }
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware