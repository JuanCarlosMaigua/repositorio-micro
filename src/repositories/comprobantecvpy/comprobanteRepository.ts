import { executeStoredProcedure, executeStoredProcedurePaCvCsign } from '../../utils/dbmysql';
import { logger } from '../../utils/logger';
import { MensajeComprobante } from '../../models/comprobantecvpy/mensajeComprobante';
import { format, parse } from 'date-fns';

export class ComprobanteRepository {
  private readonly formatoOrigen: string;
  private readonly formatoDestino: string;

  constructor() {
    // Estas variables deberían venir de las variables de entorno
    this.formatoOrigen = process.env.FORMATO_ORIGEN || 'MM/dd/yyyy HH:mm:ss';
    this.formatoDestino = process.env.FORMATO_DESTINO || 'yyyy/MM/dd HH:mm';
  }

  async registrar(compb: MensajeComprobante): Promise<any> {
    try {
      logger.info('Iniciando registro de comprobante', { uuid: compb.uuid, uniqueTransCode: compb.uniqueTransCode });

      const convertedDate = await this.convertirFecha(compb.dateTrans);
      logger.info('Fecha convertida exitosamente', { original: compb.dateTrans, converted: convertedDate });

      const params = [
        compb.uuid,                 // e_idtransaction
        compb.uniqueTransCode,      // e_cod_trans
        parseInt(compb.ipAgency),   // e_ip_agency
        convertedDate,              // e_date
        compb.officeCode,           // e_office_code
        compb.currency,             // e_currency
        compb.officeUser,           // e_office_user
        compb.sec,                  // e_sec
        compb.transCode,            // e_transc_code
        compb.transDescripction,    // e_transc_description
        compb.officeHours,          // e_office_hours
        null,                       // s_status (output parameter)
        null                        // s_error_msg (output parameter)
      ];
      logger.info('Parámetros para pa_cv_itransactioncheck', { params });

      const result = await executeStoredProcedure<any[]>(
        'pa_cv_itransactioncheck',
        params
      );
      logger.info('Stored procedure ejecutado exitosamente', result);

      return this.extractStoredProcedureResult(result);
    } catch (error) {
      logger.error('Error en registrar', error);
      throw error;
    }
  }

  async registrarTc(compb: MensajeComprobante): Promise<any> {
    try {
      const convertedDate = await this.convertirFecha(compb.dateTrans);
      
      const params = [
        compb.uuid,                 // e_idtransaction
        compb.codeRec,              // e_cod_trans
        parseInt(compb.ipAgency),   // e_ip_agency
        convertedDate,              // e_date
        compb.officeCode,           // e_office_code
        compb.currency,             // e_currency
        compb.officeUser,           // e_office_user
        compb.sec,                  // e_sec
        compb.transCode,            // e_transc_code
        compb.transDescripction,    // e_transc_description
        compb.officeHours,          // e_office_hours
        compb.closingDate,          // e_closing_date
        null,                       // s_status (output parameter)
        null                        // s_error_msg (output parameter)
      ];

      const result = await executeStoredProcedure<any[]>(
        'pa_cv_itransactioncheck_tc',
        params
      );

      return this.extractStoredProcedureResult(result);
    } catch (error) {
      logger.error('Error en registrarTc', error);
      throw error;
    }
  }

  async registrarPs(compb: MensajeComprobante): Promise<any> {
    try {
      const convertedDate = await this.convertirFecha(compb.dateTrans);
      
      const params = [
        compb.uuid,                 // e_idtransaction
        compb.uniqueTransCode,      // e_cod_trans
        parseInt(compb.ipAgency),   // e_ip_agency
        convertedDate,              // e_date
        compb.officeCode,           // e_office_code
        compb.currency,             // e_currency
        compb.officeUser,           // e_office_user
        compb.sec,                  // e_sec
        compb.transCode,            // e_transc_code
        compb.transDescripction,    // e_transc_description
        compb.officeHours,          // e_office_hours
        compb.closingDate,          // e_closing_date
        compb.accesKey,             // e_acces_key
        compb.unpaidMonth,          // e_unpaid_month
        compb.bill,                 // e_bill
        compb.billDate,             // e_description_bill_date
        compb.startDate,            // e_start_date
        compb.codeRec,              // e_service_code
        compb.rucCompanyVal,        // e_ruc
        compb.direction,            // e_direction
        null,                       // s_status (output parameter)
        null                        // s_error_msg (output parameter)
      ];

      const result = await executeStoredProcedure<any[]>(
        'pa_cv_itransactioncheck_ps',
        params
      );

      return this.extractStoredProcedureResult(result);
    } catch (error) {
      logger.error('Error en registrarPs', error);
      throw error;
    }
  }

  async consultarFirma(ct: string): Promise<any> {
    try {
      const params = [
        ct,        // e_ct
        null,      // s_sign (output parameter)
        null       // s_error_code (output parameter)  pa_cv_csign
      ];
      logger.info(`Request  : `,ct);
      const result = await executeStoredProcedurePaCvCsign<any[]>(
        'pa_cv_csign',
        params
      );
      logger.info(`RESPONSE  : `,result);
      return this.extractStoredProcedureResult(result);
    } catch (error) {
      logger.error('Error en consultarFirma', error);
      throw error;
    }
  }

  private extractStoredProcedureResult(result: any[]): any {
    // Extraer el resultado del output del stored procedure
    if (Array.isArray(result) && result.length > 0) {
      // En algunos casos, el resultado puede ser un array de arrays o un objeto
      if (result[0] && Array.isArray(result[0]['#result-set-1']) && result[0]['#result-set-1'].length > 0) {
        return result[0]['#result-set-1'][0];
      }
      
      // Para procedimientos que devuelven un único conjunto de resultados como un objeto
      if (typeof result[0] === 'object' && !Array.isArray(result[0])) {
        return result[0];
      }
      
      // Para procedimientos que devuelven múltiples conjuntos de resultados
      if (Array.isArray(result[0]) && result[0].length > 0) {
        return result[0][0];
      }
    }
    return {};
  }

  private async convertirFecha(oldDateString: string): Promise<string> {
    try { 
    const normalized = oldDateString?.replace(/\s+/g, ' ').trim();
    // Intentar parsear con el formato configurado
    const date = parse(normalized, this.formatoOrigen, new Date());
    return format(date, this.formatoDestino);
    } catch (error) {
      logger.error('Error converting date', error);
      // Si falla, intentamos usar el formato ISO
      try {
        const date = new Date(oldDateString);
        return format(date, this.formatoDestino);
      } catch (e) {
        logger.error('Error converting date with fallback method', e);
        return oldDateString; 
      }
    }
  }
}