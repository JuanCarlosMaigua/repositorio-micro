import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createSuccessResponse, createErrorResponse, Util } from '../../utils/response';
import { logger } from '../../utils/logger';
import { BasicServiceService } from '../../services/recaudacioncvpy/basicServiceService';
import { closeRedisConnection } from '../../services/recaudacioncvpy/cache';
import { InMsgGetBasicService } from '../../models/recaudacioncvpy/InMsgGetBasicService';
import { withInterceptor } from '../../midddleware/interceptor';

/**
 * Handler para consultarServicioBasico
 * Endpoint: POST /RecaudacionCvPY/consultarServicioBasico
 */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info(`Request recibida en consultarServicioBasico`);
  
  // Obtener el ID de secuencia para seguimiento (de los headers)
  const secuencial = event.headers?.secuencial || Date.now().toString();
  logger.info(`Secuencial: ${secuencial}`);
  
  try {
    // Validar que exista un cuerpo de request
    if (!event.body) {
      return createErrorResponse(
        Util.errCodeCtr, 
        'Se requiere un cuerpo en la petición', 
        'No se proporcionó cuerpo en la petición'
      );
    }

    // Parsear el cuerpo de la petición
    const requestBody: InMsgGetBasicService = JSON.parse(event.body);
    
    // Validar datos requeridos
    if (!requestBody.company?.idCompany) {
      return createErrorResponse(
        Util.errCodeCtr, 
        'Se requiere la compañía', 
        'company.idCompany es requerido'
      );
    }
    
    if (!requestBody.serviceCode) {
      return createErrorResponse(
        Util.errCodeCtr, 
        'Se requiere el código de servicio', 
        'serviceCode es requerido'
      );
    }
    
    // Crear instancia del servicio
    const basicServiceService = new BasicServiceService();
    const errores = Util.validarStringsEnObjeto(requestBody);

    if (errores.length > 0) {
      return createErrorResponse(
        '400', 
        'Validación de Datos', 
        errores[0]
      );
    }
    // Consultar servicio básico
    const result = await basicServiceService.getBasicService(requestBody);
    
    // Retornar respuesta exitosa
    return createSuccessResponse(result);
  } catch (error) {
    // Loguear el error
    logger.error('Error en consultarServicioBasico handler', error);
    
    // Retornar respuesta de error
    return createErrorResponse();
  } finally {
    // Cerrar conexión a Redis
    await closeRedisConnection();
  }
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware