// src/functions/cuentacvpy/obtenerCuenta.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '../../utils/logger';
import { CuentaService } from '../../services/cuentacvpy/cuentaService';
import { createSuccessResponse, createErrorResponse, Util } from '../../utils/response';
import { withInterceptor } from '../../midddleware/interceptor';

/**
 * Handler para obtenerCuenta
 * Endpoint: GET /CuentaCvPY/obtenerCuenta
 */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info(`Request recibida en obtenerCuenta`);
  
  // Obtener el número de cuenta del query string
  const accountNumber = event.queryStringParameters?.accountNumber;
  
  // Validar que se proporcionó un número de cuenta
  if (!accountNumber) {
    return createErrorResponse(
      '400', 
      'Número de cuenta requerido', 
      'El parámetro accountNumber es obligatorio'
    );
  }
  
  try {
    // Crear instancia del servicio
    const cuentaService = new CuentaService();
    
    // Llamar al servicio para obtener la cuenta
    for (const [key, value] of Object.entries(accountNumber)) {
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
    const result = await cuentaService.getAccount(accountNumber, event.headers);
    
    // Retornar respuesta
    return createSuccessResponse(result);
  } catch (error) {
    // Loguear el error
    logger.error('Error en obtenerCuenta handler', error);
    
    // Retornar respuesta de error
    return createErrorResponse();
  }
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware