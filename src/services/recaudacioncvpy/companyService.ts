// src/services/recaudacioncvpy/companyService.ts
import { logger } from '../../utils/logger';
import { BasicServiceRepository } from '../../repositories/recaudacioncvpy/basicServiceRepository';
import { getServices, getCompanys } from './cache';
import { Util } from '../../utils/response';
import { OutMsgListServices } from '../../models/recaudacioncvpy/OutMsgListServices';
import { OutMsgListCompanys } from '../../models/recaudacioncvpy/OutMsgListCompanys';
import { InMsgListCompanys } from '../../models/recaudacioncvpy/InMsgListCompanys';
export class CompanyService {
  private readonly basicServiceRepository: BasicServiceRepository;
  constructor() {
    logger.info('Inicializando CompanyService');
    this.basicServiceRepository = new BasicServiceRepository();
  }
  /**
   * Lista todos los servicios disponibles
   */
  async listServices(headers:any): Promise<OutMsgListServices> {
    logger.info('Iniciando listServices');
    const outMs: OutMsgListServices = {
      errorCode: Util.errCode,
      userMessage: Util.errMessage,
      systemMessage: Util.errMessage
    };
    try {
      // Función que obtiene servicios directamente del repositorio
      const fetchServices = async () => {
        logger.info('Llamando a basicServiceRepository.getServices()');
        const services = await this.basicServiceRepository.getServices();
        logger.info(`getServices retornó ${services ? services.length : 0} servicios`);
        return services;
      };
      // Obtener servicios desde cache o repositorio
      logger.info('Llamando a getServices (caché o repositorio)');
      const services = await getServices(fetchServices);
      logger.info(`getServices completado, obtuvo: ${services ? services.length : 0} servicios`);
      
      if (services && services.length > 0) {
        logger.info(`Retornando ${services.length} servicios encontrados`);
        outMs.service = services;
        outMs.errorCode = Util.okCode;
        outMs.userMessage = Util.okMessage;
        outMs.systemMessage = Util.okMessage;
      } else {
        logger.warn('No se encontraron servicios, retornando "No existe información"');
        outMs.errorCode = Util.errCodeCtr;
        outMs.userMessage = "No existe información";
        outMs.systemMessage = "No existe información";
      }
    } catch (error) {
      logger.error('Error en listServices', error);
      outMs.errorCode = Util.errCode;
      outMs.userMessage = Util.errMessage;
      outMs.systemMessage = error instanceof Error ? error.message : String(error);
    }
    logger.info(`listServices finalizado con código: ${outMs.errorCode}`);
    return outMs;
  }

  async listCompanys(inMs: InMsgListCompanys): Promise<OutMsgListCompanys> {
    logger.info(`Iniciando listCompanys para servicio ID: ${inMs?.service?.idService}`);
    const outMs: OutMsgListCompanys = {
      errorCode: Util.errCode,
      userMessage: Util.errMessage,
      systemMessage: Util.errMessage
    };
    try {
      // Validar que exista el servicio y su ID
      if (!inMs.service?.idService) {
        logger.error('Se requiere servicio - parámetro inválido');
        throw new Error("Se requiere servicio");
      }
      
      logger.info(`Preparando fetchCompanys para servicio ID: ${inMs.service.idService}`);
      // Función que obtiene compañías directamente del repositorio
      const fetchCompanys = async (serviceId: number) => {
        logger.info(`Ejecutando basicServiceRepository.getCompanys para serviceId: ${serviceId}`);
        try {
          const result = await this.basicServiceRepository.getCompanys(serviceId)
          logger.info(`COMPANYS completado: `,result);
          logger.info(`getCompanys retornó ${result ? result.length : 0} compañías para servicio ${serviceId}`);
          return result;
        } catch (error) {
          logger.error(`Error en fetchCompanys para serviceId ${serviceId}:`, error);
          throw error;
        }
      };
      
      // Obtener compañías desde cache o repositorio
      logger.info(`Llamando a getCompanys (caché o repositorio) para servicio ID: ${inMs.service.idService}`);
      const companys = await getCompanys(inMs.service.idService, fetchCompanys);
      logger.info(`COMPANYS completado: `,companys);
      logger.info(`getCompanys completado, obtuvo: ${companys ? companys.length : 0} compañías`);
      
      if (companys && companys.length > 0) {
        logger.info(`Retornando ${companys.length} compañías encontradas`);
        outMs.companys = companys;
        outMs.errorCode = Util.okCode;
        outMs.userMessage = Util.okMessage;
        outMs.systemMessage = Util.okMessage;
      } else {
        logger.warn(`No se encontraron compañías para el servicio ID: ${inMs.service.idService}, retornando "No existe información"`);
        outMs.errorCode = Util.errCodeCtr;
        outMs.userMessage = "No existe información";
        outMs.systemMessage = "No existe información";
      }
    } catch (error) {
      logger.error(`Error en listCompanys para servicio ID: ${inMs?.service?.idService}`, error);
      outMs.errorCode = Util.errCode;
      outMs.userMessage = Util.errMessage;
      outMs.systemMessage = error instanceof Error ? error.message : String(error);
    }
    logger.info(`listCompanys finalizado con código: ${outMs.errorCode}`);
    return outMs;
  }


}
