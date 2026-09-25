import { logger } from '../../utils/logger';
import { executeStoredProcedure } from '../../utils/dbmysql';
import { CVService } from '../../models/recaudacioncvpy/Service';
import { Company } from '../../models/transaccioncvpy/company';
import { Catalog } from '../../models/transaccioncvpy/catalog';

export class BasicServiceRepository {
  
  // Obtener todos los servicios
  async getServices(): Promise<CVService[]> {
    try {
      logger.info('Ejecutando procedimiento almacenado: pa_cv_cservices');
      
      // Llamar al stored procedure sin parámetros
      const result = await executeStoredProcedure<any[]>('pa_cv_cservices', []);
      logger.info(`Resultado raw : ${JSON.stringify(result)}`);

      // El resultado contiene un array con el primer elemento siendo un objeto con la clave "#result-set-1"
      const resultSet = result?.[0]?.['#result-set-1'] || result?.[0] || [];
      logger.info(`RESULSET: `,resultSet);
      logger.info(`Filas encontradas en la base de datos : ${resultSet.length}`);
      
      // Mapear los resultados a objetos Service
      const services: CVService[] = resultSet.map((row: { SE_ID: number; SE_NAME: string }) => ({
        idService: row.SE_ID,
        nameService: row.SE_NAME
      }));
      
      logger.info(`Mapear los resultados a objetos Service: `,services);
      return services;
    } catch (error) {
      logger.error('Error al consultar servicios', error);
      throw error;
    }
  }
  
  // Obtener compañías por servicio
  async getCompanys(serviceId: number): Promise<Company[]> {
    try {
      logger.debug(`Ejecutando procedimiento almacenado: pa_cv_ccompanys para serviceId: ${serviceId}`);
      
      // Llamar al stored procedure con el ID del servicio
      const result = await executeStoredProcedure<any[]>('pa_cv_ccompanys', [serviceId]); 
      logger.info(`RESULSET executeStoredProcedure pa_cv_ccompanys: `,result);

      logger.info(`Resultado raw para serviceId ${serviceId}: ${JSON.stringify(result)}`);
    
      const resultSet = result[0]; // El primer elemento del array contiene los datos reales

      logger.info(`RESULSET SEGUNDO: `,resultSet);
      logger.info(`Filas encontradas en la base de datos para serviceId ${serviceId}: ${resultSet.length}`);
      // Lista para almacenar todas las compañías
      const companies: Company[] = [];
      
      // Procesar cada fila y obtener datos de catálogo para cada compañía
      for (const row of resultSet) {
        const company: Company = {
          idCompany: row.CO_ID,
          nameCompany: row.CO_NAME,
          idService: serviceId
        };
        
        // Obtener catálogos relacionados
          company.type = await this.getCatalogCompany(company.idCompany!, row.CO_TYPE);
        
          company.region = await this.getCatalogCompany(company.idCompany!, row.CO_REGION);
        
          company.area = await this.getCatalogCompany(company.idCompany!, row.CO_AREA);
        
        companies.push(company);
      }
      
      return companies;
    } catch (error) {
      logger.error(`Error al consultar compañías para el servicio ${serviceId}`, error);
      throw error;
    }
  }
  
  // Obtener catálogos para una compañía y nemonico específicos
  async getCatalogCompany(idCompany: number, nemonic: string): Promise<Catalog[]> {
    try {
      logger.info(`Ejecutando procedimiento almacenado: pa_cv_ccatalog_company para idCompany: ${idCompany}, nemonic: ${nemonic}`);
      
      // Llamar al stored procedure con los parámetros
      const result = await executeStoredProcedure<any[]>('pa_cv_ccatalog_company', [idCompany, nemonic]);
      logger.info(`RESULT: pa_cv_ccatalog_company para idCompany: ${idCompany}, nemonic: ${nemonic}`,result);

      // El resultado contiene un array con el primer elemento siendo un objeto con la clave "#result-set-1"
      const resultSet = result[0];
      logger.info(`RESULTSET get Catalog Company - executeStoredProcedure: :`,resultSet);


        // Definir la interfaz para la fila del resultado
    interface CatalogRow {
      CA_KEY: string;
      CA_VAL: string;
      [key: string]: any; // Para cualquier otra propiedad que pueda existir
    }
    
    // Mapear los resultados a objetos Catalog con tipo explícito
    const catalog: Catalog[] = resultSet.map((row: CatalogRow) => ({
      key: row.CA_KEY,
      value: row.CA_VAL
    }));
    logger.info(`Mapear los resultados a objetos Catalog con tipo explícito: :`,catalog);

      return catalog;
    } catch (error) {
      logger.error(`Error al consultar catálogo para compañía ${idCompany} y nemónico ${nemonic}`, error);
      throw error;
    }
  }
  
  // Obtener atributos de una compañía específica
  async getCompanyAttr(id: number): Promise<Record<string, string>> {
    try {
      logger.info(`Ejecutando procedimiento almacenado: pa_cv_ccatalog_company_attr para id: ${id}`);
      
      // Llamar al stored procedure con el ID de la compañía
      const result = await executeStoredProcedure<any[]>('pa_cv_ccatalog_company_attr', [id]);
      
      // El resultado contiene un array con el primer elemento siendo un objeto con la clave "#result-set-1"
      const resultSet =  result?.[0] || [];

      logger.info(`RESULSET: `,resultSet);
      logger.info(`Filas encontradas en la base de datos para serviceId ${id}: ${resultSet.length}`);
      
      // Convertir el resultado a un objeto con pares clave-valor
      const attributes: Record<string, string> = {};
      resultSet.forEach((row: { CA_KEY: string; CA_VAL: string }) => {
        attributes[row.CA_KEY] = row.CA_VAL;
      });
      logger.info(`ATTRIBUTES: `,attributes);
      return attributes;
    } catch (error) {
      logger.error(`Error al consultar atributos para la compañía ${id}`, error);
      throw error;
    }
  }
  
  // Obtener un catálogo específico
  async getCatalog(table: string): Promise<Record<string, string>> {
    try {
      logger.info(`Ejecutando procedimiento almacenado: pa_cv_ccatalog para tabla: ${table}`);
      
      // Llamar al stored procedure con el nombre de la tabla
      const result = await executeStoredProcedure<any[]>('pa_cv_ccatalog', [table]);
      
      // El resultado contiene un array con el primer elemento siendo un objeto con la clave "#result-set-1"
      const resultSet = result?.[0] || [];

      logger.info(`RESULSET: `,resultSet);
      logger.info(`Filas encontradas en la base de datos para table ${table}: ${resultSet.length}`);
      
      // Convertir el resultado a un objeto con pares clave-valor
      const catalog: Record<string, string> = {};
      resultSet.forEach((row: { CA_KEY: string; CA_VAL: string }) => {
        catalog[row.CA_KEY] = row.CA_VAL;
      });
      logger.info(`ATTRIBUTES CATALOG: `,catalog);
      return catalog;
    } catch (error) {
      logger.error(`Error al consultar catálogo para la tabla ${table}`, error);
      throw error;
    }
  }
}