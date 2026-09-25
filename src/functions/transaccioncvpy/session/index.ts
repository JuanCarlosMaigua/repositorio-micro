import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { InMsgLogin } from '../../../models/transaccioncvpy/session';
import { SessionService } from '../../../services/transaccioncvpy/sessionService';
import { logger } from '../../../utils/logger';
import { Util, createErrorResponse, createSuccessResponse } from '../../../utils/response';
import { withInterceptor } from '../../../midddleware/interceptor';

/**
 * Handler para los endpoints de sesión (iniciarSession, cerrarSession)
 * @param event Evento de API Gateway
 * @returns Respuesta de API Gateway
 */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info(`Procesando solicitud de session: ${event.path}`);
  
  try {
    if (!event.body) {
      return createErrorResponse('400', 'Cuerpo de la solicitud vacío', 'El cuerpo de la solicitud está vacío');
    }
    
    const inMsg: InMsgLogin = JSON.parse(event.body);
    
    // Validar la estructura de la solicitud
    if (!inMsg.session) {
      return createErrorResponse('400', 'Solicitud inválida', 'La solicitud no contiene información de sesión');
    }
    
    const sessionService = new SessionService();
    const errores = Util.validarStringsEnObjeto(inMsg);

    if (errores.length > 0) {
      return createErrorResponse(
        '400', 
        'Validación de Datos', 
        errores[0]
      );
    }
    
    // Determinar qué operación realizar según el path
    if (event.path.endsWith('/iniciarSesion')) { 
      logger.info("INICIAS SESION");
      const result = await sessionService.login(inMsg);
      return createSuccessResponse(result);
    } else if (event.path.endsWith('/cerrarSesion')) {
      logger.info("CERRAR SESION");
      const result = await sessionService.logout(inMsg);
      return createSuccessResponse(result);
    } else {
      return createErrorResponse('404', 'Endpoint no encontrado', 'La ruta especificada no existe');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`Error al procesar la solicitud de sesión: ${errorMessage}`);
    return createErrorResponse();
  }
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware