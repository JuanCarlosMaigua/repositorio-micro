import { logger } from '../../utils/logger';
import { Util } from '../../utils/response';
import { SessionRepository } from '../../repositories/transaccioncvpy/sessionRepository';
import { BasicResponse } from '../../models/transaccioncvpy/common';

export abstract class BaseService {
  protected sessionRepository: SessionRepository;

  constructor() {
    this.sessionRepository = new SessionRepository();
  }

  protected async getConfigurationData() {
    const config = await this.sessionRepository.getConfigurations();
    
    return {
      lifeTimeMobile: config.s_tiempovida,
      lifeTimeWeb: config.s_tiempovida_web,
      canTransactions: config.s_canttransc,
      legalInformation: config.s_infolegal,
      maxAmmount: config.s_maxefectivo
    };
  }


  protected setSuccessResponse(response: BasicResponse): void {
    response.errorCode = Util.okCode;
    response.systemMessage = Util.okMessage;
    response.userMessage = Util.okMessage;
  }


  protected setControllerErrorResponse(response: BasicResponse, message?: string): void {
    response.errorCode = Util.errCodeCtr;
    response.userMessage = message || Util.errMessage;
    response.systemMessage = message || Util.errMessage;
  }


  protected handleServiceError(response: BasicResponse, error: any): void {
    logger.error('Error in service:', error);
    response.errorCode = Util.errCode;
    response.userMessage = 'OCURRIÓ UN ERROR AL CONSULTAR EL SERVICIO';
    response.systemMessage = 'OCURRIÓ UN ERROR AL CONSULTAR EL SERVICIO';
  }


  protected async executeServiceMethod<T extends BasicResponse>(
    responseObj: T,
    serviceFunction: () => Promise<void>,
    validationFn?: () => string | null
  ): Promise<T> {
    try {
      // Run validation if provided
      if (validationFn) {
        const errorMessage = validationFn();
        if (errorMessage) {
          this.setControllerErrorResponse(responseObj, errorMessage);
          return responseObj;
        }
      }

      // Execute main service function
      await serviceFunction();

    } catch (error) {
      this.handleServiceError(responseObj, error);
    }

    return responseObj;
  }
}