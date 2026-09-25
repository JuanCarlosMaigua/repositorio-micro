import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '../../utils/logger';
import { InMsgGetCard } from '../../models/tarjetacvpy/inMsgGetCard';
import { CardService } from '../../services/tarjetacvpy/cardService';
import { createResponse, createSuccessResponse, createErrorResponse, Util } from '../../utils/response';
import { withInterceptor } from '../../midddleware/interceptor';

const cardService = new CardService();

/**
 * Handler para consultarTarjetas
 * Endpoint: POST /TarjetaCvPY/consultarTarjetas
 */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  logger.info(`Request recibida en consultarTarjetas`);

  if (!event.body) {
    return createResponse(400, {
      errorCode: '9999',
      userMessage: 'Cuerpo de la solicitud vacío',
      systemMessage: 'Cuerpo de la solicitud vacío'
    });
  }

  try {
    const inMsg: InMsgGetCard = JSON.parse(event.body);

    if (!inMsg.client?.identification) {
      return createResponse(400, {
        errorCode: '9999',
        userMessage: 'Datos de cliente insuficientes',
        systemMessage: 'Se requiere identificación del cliente'
      });
    }
    const errores = Util.validarStringsEnObjeto(inMsg);

    if (errores.length > 0) {
      return createErrorResponse(
        '400', 
        'Validación de Datos', 
        errores[0]
      );
    }
    const result = await cardService.getCards(event.headers, inMsg);
    logger.info(`Consulta de tarjetas completada con código: ${result?.errorCode}`);
    return createSuccessResponse(result);
  } catch (error: any) {
    logger.error('Error en consultarTarjetas handler', error);

    return createErrorResponse(
      '9999',
      'Error procesando la solicitud',
      error.message || 'Error desconocido'
    );
  }
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware