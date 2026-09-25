import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { InMsgSaveTransaction } from '../../../models/transaccioncvpy/transaction';
import { TransactionService } from '../../../services/transaccioncvpy/transactionService';
import { logger } from '../../../utils/logger';
import { Util, createErrorResponse, createSuccessResponse } from '../../../utils/response';
import { withInterceptor } from '../../../midddleware/interceptor';

/**
 * Handler para el endpoint guardarTransaccion
 * @param event Evento de API Gateway
 * @returns Respuesta de API Gateway
 */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Procesando solicitud de guardarTransaccion');
  
  try {
    if (!event.body) {
      return createErrorResponse('400', 'Cuerpo de la solicitud vacío', 'El cuerpo de la solicitud está vacío');
    }
    
    const inMsg: InMsgSaveTransaction = JSON.parse(event.body);
    
    // Validar la estructura de la solicitud
    if (!inMsg.transaction) {
      return createErrorResponse('400', 'Solicitud inválida', 'La solicitud no contiene información de la transacción');
    }

    const errorIdentificacion = Util.validarCampoNumerico(
      inMsg.transaction.depositor?.identification,
      'identification'
    );

    const errorIdentificacionDeposit = Util.validarCampoNumerico(
      inMsg.transaction.deposit?.client?.identification,
      'identification'
    );

    const erroraccountNumber = Util.validarCampoNumerico(
      inMsg.transaction.deposit?.accountNumber,
      'accountNumber'
    );

    if(errorIdentificacion){
      return createErrorResponse('400', 'Solicitud inválida', 'La solicitud no contiene información valida');
    }

    if(errorIdentificacionDeposit){
      return createErrorResponse('400', 'Solicitud inválida', 'La solicitud no contiene información valida');
    }

    if(erroraccountNumber){
      return createErrorResponse('400', 'Solicitud inválida', 'La solicitud no contiene información valida');
    }

    // Validar que tipo de transacción está definido
    if (!inMsg.transaction.typeNemonic) {
      return createErrorResponse('400', 'Tipo de transacción no especificado', 'El tipo de transacción es obligatorio');
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
    const result = await transactionService.saveTransaction(inMsg, event.headers);
    
    return createSuccessResponse(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`Error al procesar la solicitud de guardar transacción: ${errorMessage}`);
    return createErrorResponse();
  }
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware