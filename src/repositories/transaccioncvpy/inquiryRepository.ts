import { InquiryRequest } from '../../models/transaccioncvpy/inquiry';
import { Poll } from '../../models/transaccioncvpy/poll';
import { executeStoredProcedureRegisterInquiry } from '../../utils/dbmysql';
import { logger } from '../../utils/logger';

export interface InquiryRegisterResult {
  s_ct: string | null;
  s_error_code: number;
  s_error_msg: string | null;
}

export class InquiryRepository {
  // Método sobrecargado para aceptar tanto Poll como InquiryRequest
  async register(inquiry: InquiryRequest | Poll): Promise<InquiryRegisterResult> {
    try {
      let pollId: number | undefined;
      let isLiked: boolean | undefined;
      let comment: string | undefined;
      let typeNemonic: string | undefined;
      
      // Determinar qué tipo de objeto recibimos
      if ('transactionID' in inquiry) {
        // Es un InquiryRequest
        pollId = inquiry.transactionID;
        isLiked = inquiry.like;
        comment = inquiry.comment;
        typeNemonic = inquiry.typeNemonic;
      } else {
        // Es un Poll
        pollId = inquiry.pollId;
        isLiked = inquiry.liked;
        comment = inquiry.comment;
        typeNemonic = inquiry.typeNemonic;
      }
      
      // Parámetros para el procedimiento almacenado
      const params = [
        pollId,
        isLiked,
        comment,
        typeNemonic || 'ENC', // Valor por defecto si no está definido
        null, // s_ct (OUT parameter)
        null, // s_error_code (OUT parameter)
        null  // s_error_msg (OUT parameter)
      ];
      
      // Ejecutar el procedimiento almacenado
      logger.info("REQUEST DATABAS",params);
      const result = await executeStoredProcedureRegisterInquiry<any[]>('pa_cv_ipoll', params);
      logger.info("RESPONSE DATABAS",result);

      
      // Valores predeterminados del resultado
      const output: InquiryRegisterResult = {
        s_ct: null,
        s_error_code: 0,
        s_error_msg: null
      };
      
      // Extraer valores de resultado
      if (Array.isArray(result) && result.length > 0) {
        if (result[0].s_error_code !== undefined) {
          output.s_ct = result[0].s_ct;
          output.s_error_code = result[0].s_error_code;
          output.s_error_msg = result[0].s_error_msg;
        } else if (Array.isArray(result[0]) && result[0].length > 0 && result[0][0]) {
          output.s_ct = result[0][0].s_ct || null;
          output.s_error_code = result[0][0].s_error_code || 0;
          output.s_error_msg = result[0][0].s_error_msg || null;
        }
      }
      
      return output;
    } catch (error) {
      logger.error('Error al registrar encuesta:', error);
      return {
        s_ct: null,
        s_error_code: 9999,
        s_error_msg: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}