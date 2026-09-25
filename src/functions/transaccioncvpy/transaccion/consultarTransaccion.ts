import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { InMsgGetTransaction } from '../../../models/transaccioncvpy/transaction';
import { TransactionService } from '../../../services/transaccioncvpy/transactionService';
import { logger } from '../../../utils/logger';
import { Util, createErrorResponse, createSuccessResponse } from '../../../utils/response';
import { withInterceptor } from '../../../midddleware/interceptor';

/**
 * Handler para el endpoint consultarTransaccion
 * @param event Evento de API Gateway
 * @returns Respuesta de API Gateway
 */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Procesando solicitud de consultarTransaccion');
  
  try {
    if (!event.body) {
      return createErrorResponse('400', 'Cuerpo de la solicitud vacío', 'El cuerpo de la solicitud está vacío');
    }
    
    const inMsg: InMsgGetTransaction = JSON.parse(event.body);
    
    // Validar la estructura de la solicitud
    if (!inMsg.ctCode) {
      return createErrorResponse('400', 'Solicitud inválida', 'El código de transacción es obligatorio');
    }
    
    const errores = Util.validarStringsEnObjeto(inMsg);

    if (errores.length > 0) {
      return createErrorResponse(
        '400', 
        'Validación de Datos', 
        errores[0]
      );
    }
    const transactionService = new TransactionService();
    const result = await transactionService.getTransaction(inMsg);
    
    return createSuccessResponse(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`Error al procesar la solicitud de consultar transacción: ${errorMessage}`);
    return createErrorResponse();
  }
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware