import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { InMsgSavePoll } from '../../../models/transaccioncvpy/poll';
import { PollService } from '../../../services/transaccioncvpy/pollService';
import { logger } from '../../../utils/logger';
import { Util, createErrorResponse, createSuccessResponse } from '../../../utils/response';
import { withInterceptor } from '../../../midddleware/interceptor';

/**
 * Handler para el endpoint guardarEncuesta (desde PollController)
 * @param event Evento de API Gateway
 * @returns Respuesta de API Gateway
 */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Procesando solicitud de poll/guardarEncuesta');
  
  try {
    if (!event.body) {
      return createErrorResponse('400', 'Cuerpo de la solicitud vacío', 'El cuerpo de la solicitud está vacío');
    }
    
    const inMsg: InMsgSavePoll = JSON.parse(event.body);
    
    // Validar la estructura de la solicitud
    if (!inMsg.poll) {
      return createErrorResponse('400', 'Solicitud inválida', 'La solicitud no contiene información de la encuesta');
    }
    const errores = Util.validarStringsEnObjeto(inMsg);

    if (errores.length > 0) {
      return createErrorResponse(
        '400', 
        'Validación de Datos', 
        errores[0]
      );
    }
    const pollService = new PollService();
    const result = await pollService.savePoll(inMsg, event.headers);
    
    return createSuccessResponse(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`Error al procesar la solicitud de poll: ${errorMessage}`);
    return createErrorResponse();
  }
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware