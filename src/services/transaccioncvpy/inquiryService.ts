import { InquiryRequest } from '../../models/transaccioncvpy/inquiry';
import { InquiryRepository } from '../../repositories/transaccioncvpy/inquiryRepository';
import { logger } from '../../utils/logger';
import { Util } from '../../utils/response';

export class InquiryService {
  private readonly inquiryRepository: InquiryRepository;
  
  constructor() {
    this.inquiryRepository = new InquiryRepository();
  }
  
  async registerInquiry(inquiry: InquiryRequest): Promise<any> {
    try {
      logger.error(`REQUEST INQUIRY: `,inquiry);

      const result = await this.inquiryRepository.register(inquiry);
      logger.error(`response INQUIRY: `,result);

      if (result.s_error_code === 0) {
        return {
          errorCode: Util.okCode,
          userMessage: Util.okMessage,
          systemMessage: Util.okMessage
        };
      } else {
        logger.error(`Error en SP: ${result.s_error_msg}`);
        return {
          errorCode: String(result.s_error_code),
          userMessage: Util.errMessage,
          systemMessage: result.s_error_msg || Util.errMessage
        };
      }
    } catch (error) {
      logger.error('Error al registrar encuesta:', error);
      return {
        errorCode: Util.errCode,
        userMessage: 'OCURRIÓ UN ERROR AL CONSULTAR EL SERVICIO',
        systemMessage: 'OCURRIÓ UN ERROR AL CONSULTAR EL SERVICIO'
      };
    }
  }
}