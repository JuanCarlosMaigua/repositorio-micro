import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { InquiryRequest } from '../../../models/transaccioncvpy/inquiry';
import { InquiryService } from '../../../services/transaccioncvpy/inquiryService';
import { logger } from '../../../utils/logger';
import { Util, createErrorResponse, createSuccessResponse } from '../../../utils/response';
import { withInterceptor } from '../../../midddleware/interceptor';

/**
 * Handler para el endpoint guardarEncuesta (desde InquiryController)
 * @param event Evento de API Gateway
 * @returns Respuesta de API Gateway
 */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Procesando solicitud de inquiry/guardarEncuesta');
  
  try {
    if (!event.body) {
      return createErrorResponse('400', 'Cuerpo de la solicitud vacío', 'El cuerpo de la solicitud está vacío');
    }
    
    const inquiryRequest: InquiryRequest = JSON.parse(event.body);
    
    // Validar la estructura de la solicitud
    if (inquiryRequest.transactionID === undefined) {
      return createErrorResponse('400', 'Solicitud inválida', 'La solicitud no contiene el ID de transacción');
    }
    const errores = Util.validarStringsEnObjeto(inquiryRequest);

    if (errores.length > 0) {
      return createErrorResponse(
        '400', 
        'Validación de Datos', 
        errores[0]
      );
    }
    const inquiryService = new InquiryService();
    const result = await inquiryService.registerInquiry(inquiryRequest);
    
    return createSuccessResponse(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`Error al procesar la solicitud de inquiry: ${errorMessage}`);
    return createErrorResponse();
  }
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware