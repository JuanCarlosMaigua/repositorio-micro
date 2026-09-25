import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { InMsgSaveDevice } from '../../../models/transaccioncvpy/device';
import { DeviceService } from '../../../services/transaccioncvpy/deviceService';
import { logger } from '../../../utils/logger';
import { Util, createErrorResponse, createSuccessResponse } from '../../../utils/response';
import { withInterceptor } from '../../../midddleware/interceptor';

/**
 * Handler para el endpoint guardarDispositivo
 * @param event Evento de API Gateway
 * @returns Respuesta de API Gateway
 */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Procesando solicitud de guardarDispositivo');

  try {
    if (!event.body) {
      return createErrorResponse('400', 'Cuerpo de la solicitud vacío', 'El cuerpo de la solicitud está vacío');
    }
    
    const inMsg: InMsgSaveDevice = JSON.parse(event.body);
    
    // Validar la estructura de la solicitud
    if (!inMsg.device) {
      return createErrorResponse('400', 'Solicitud inválida', 'La solicitud no contiene información del dispositivo');
    }
    const errores = Util.validarStringsEnObjeto(inMsg);

    if (errores.length > 0) {
      return createErrorResponse(
        '400', 
        'Validación de Datos', 
        errores[0]
      );
    }
    const deviceService = new DeviceService();
    const outMsg = await deviceService.saveDevice(inMsg);
    
    return createSuccessResponse(outMsg);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`Error al procesar la solicitud de dispositivo: ${errorMessage}`);
    return createErrorResponse();
  }
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware