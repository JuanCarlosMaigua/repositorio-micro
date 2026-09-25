import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createSuccessResponse, createErrorResponse, Util } from '../../utils/response';
import { logger } from '../../utils/logger';
import { CompanyService } from '../../services/recaudacioncvpy/companyService';
import { closeRedisConnection } from '../../services/recaudacioncvpy/cache';
import { InMsgListCompanys } from '../../models/recaudacioncvpy/InMsgListCompanys';
import { withInterceptor } from '../../midddleware/interceptor';

/**
 * Handler para consultarEmpresas
 * Endpoint: POST /RecaudacionCvPY/consultarEmpresas
 */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info(`Request recibida en consultarEmpresas`);
  
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
    const requestBody: InMsgListCompanys = JSON.parse(event.body);
    
    // Validar datos requeridos
    if (!requestBody.service?.idService) {
      return createErrorResponse(
        Util.errCodeCtr, 
        'Se requiere el ID del servicio', 
        'service.idService es requerido'
      );
    }
    
    // Crear instancia del servicio
    const companyService = new CompanyService();
    const errores = Util.validarStringsEnObjeto(requestBody);

    if (errores.length > 0) {
      return createErrorResponse(
        '400', 
        'Validación de Datos', 
        errores[0]
      );
    }
    // Obtener la lista de empresas
    const result = await companyService.listCompanys(requestBody);
    
    // Retornar respuesta exitosa
    return createSuccessResponse(result);
  } catch (error) {
    // Loguear el error
    logger.error('Error en consultarEmpresas handler', error);
    
    // Retornar respuesta de error
    return createErrorResponse();
  } finally {
    // Cerrar conexión a Redis
    await closeRedisConnection();
  }
};

export const handler = withInterceptor(baseHandler); // <--- aplicar el middleware