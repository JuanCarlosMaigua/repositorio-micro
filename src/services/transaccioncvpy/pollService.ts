import { BasicResponse } from '../../models/transaccioncvpy/common';
import { InMsgSavePoll } from '../../models/transaccioncvpy/poll';
import { InquiryRepository } from '../../repositories/transaccioncvpy/inquiryRepository';
import { logger } from '../../utils/logger';
import { Util } from '../../utils/response';

export class PollService {
  private readonly inquiryRepository: InquiryRepository;
  
  constructor() {
    this.inquiryRepository = new InquiryRepository();
  }
  
  async savePoll(inMsg: InMsgSavePoll, headers: Record<string, string | undefined>): Promise<BasicResponse> {
    const outMsg: BasicResponse = {
      errorCode: Util.errCode,
      userMessage: Util.errMessage,
      systemMessage: Util.errMessage
    };
    
    try {
      const result = await this.inquiryRepository.register(inMsg.poll);
      
      if (result.s_error_code === 0) {
        // Podríamos enviar la encuesta a un servicio de notificación si es necesario
        // await this.sendPollToNotificationService(result.s_ct, inMsg.poll, headers);
        
        outMsg.errorCode = Util.okCode;
        outMsg.userMessage = Util.okMessage;
        outMsg.systemMessage = Util.okMessage;
      } else {
        logger.error(`Error en SP: ${result.s_error_msg}`);
        outMsg.errorCode = String(result.s_error_code);
        outMsg.userMessage = Util.errMessage;
        outMsg.systemMessage = result.s_error_msg || Util.errMessage;
      }
    } catch (error) {
      logger.error('Error al procesar solicitud de encuesta:', error);
      outMsg.errorCode = Util.errCode;
      outMsg.userMessage = 'OCURRIÓ UN ERROR AL CONSULTAR EL SERVICIO';
      outMsg.systemMessage = 'OCURRIÓ UN ERROR AL CONSULTAR EL SERVICIO';
    }
    
    return outMsg;
  }
}