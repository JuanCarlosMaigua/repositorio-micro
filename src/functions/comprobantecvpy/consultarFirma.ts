import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '../../utils/logger';
import { ComprobanteService } from '../../services/comprobantecvpy/comprobanteService';
import { MensajeEntradaConsultarFirma } from '../../models/comprobantecvpy/mensajeEntradaConsultarFirma';
import { createSuccessResponse, createErrorResponse, Util } from '../../utils/response';
import { withInterceptor } from '../../midddleware/interceptor';

/**
 * Handler para consultarFirma
 * Endpoint: POST /ComprobanteCvPY/consultarFirma
 */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info(`Request recibida en consultarFirmas`);

  try {
    let mensajeEntrada: MensajeEntradaConsultarFirma;

    if (!event.body) {
      logger.error("400, Cuerpo de la solicitud vacío, El cuerpo de la solicitud está vacío");
      return createErrorResponse('400', 'Cuerpo de la petición vacío', 'No se proporcionó cuerpo en la petición');
    }

    try {
      // Intentar parsear como JSON 
      mensajeEntrada = JSON.parse(event.body);
    } catch {
      // Si falla, intentar como x-www-form-urlencoded
      const params = new URLSearchParams(event.body);
      const ct = params.get("ct");

      if (!ct) {
        logger.error("400, Solicitud inválida, El código de transacción es obligatorio");
        return createErrorResponse('400', 'Campo faltante', 'No se encontró el campo "ct".');
      }

      mensajeEntrada = { ct };
    }

    const comprobanteService = new ComprobanteService();
    logger.info("Ingresa a Gestransaccion");
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

    const resultado = await comprobanteService.consultarFirma(mensajeEntrada);
    logger.info("Resulkt a Gestransaccion",resultado);
    return createSuccessResponse(resultado);

  } catch (error: any) {
    logger.error('Error en consultarFirma handler:', error);
    return createErrorResponse(
      String(error.errorCode || '500'),
      error.userMessage || 'Error al procesar la solicitud',
      error.message || 'Error interno del servidor'
    );
  }
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware