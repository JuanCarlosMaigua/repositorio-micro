import { InMsgLogin, OutMsgLogin } from '../../models/transaccioncvpy/session';
import { BasicResponse } from '../../models/transaccioncvpy/common';
import { InMsgSavePoll } from '../../models/transaccioncvpy/poll';
import { InquiryRepository } from '../../repositories/transaccioncvpy/inquiryRepository';
import { logger } from '../../utils/logger';
import { BaseService } from './BaseService';

export class SessionService extends BaseService {
  private readonly inquiryRepository: InquiryRepository;
  
  constructor() {
    super();
    this.inquiryRepository = new InquiryRepository();
  }
  
  /**
   * Login a device and create a session
   * @param inMsg Login request data
   * @returns Response with session and configuration data
   */
  async login(inMsg: InMsgLogin): Promise<OutMsgLogin> {
    // Initialize response object
    const outMsg: OutMsgLogin = {
      errorCode: '',
      userMessage: '',
      systemMessage: ''
    };
    
    return this.executeServiceMethod(
      outMsg,
      async () => {
        // Validate device ID
        if (!inMsg.session.deviceId) {
          this.setControllerErrorResponse(outMsg, 'Dispositivo no especificado');
          return;
        }
        
        const ip = inMsg.session.ip || '127.0.0.1';
        
        // Call login
        const result = await this.sessionRepository.login(
          inMsg.session.deviceId,
          ip
        );
        
        if (result.s_status !== null) {
          // Get configuration data
          outMsg.configuration = await this.getConfigurationData();
          
          // Create session data
          outMsg.session = {
            ...inMsg.session,
            sessionId: result.s_status
          };
          
          this.setSuccessResponse(outMsg);
        } else {
          logger.error('Error al iniciar sesión');
          this.setControllerErrorResponse(outMsg);
        }
      }
    );
  }
  
  /**
   * Logout and close a session
   * @param inMsg Logout request data
   * @returns Basic response
   */
  async logout(inMsg: InMsgLogin): Promise<BasicResponse> {
    // Initialize response object
    const outMsg: BasicResponse = {
      errorCode: '',
      userMessage: '',
      systemMessage: ''
    };
    
    return this.executeServiceMethod(
      outMsg,
      async () => {
        // Validate session data
        if (!inMsg.session.sessionId || !inMsg.session.ipAgency) {
          this.setControllerErrorResponse(outMsg, 'Datos de sesión incompletos');
          return;
        }
        
        // Call logout
        await this.sessionRepository.logout(
          inMsg.session.sessionId,
          inMsg.session.ipAgency
        );
        
        this.setSuccessResponse(outMsg);
      }
    );
  }
  
  /**
   * Save poll data
   * @param inMsg Poll data request
   * @returns Basic response
   */
  async savePoll(inMsg: InMsgSavePoll): Promise<BasicResponse> {
    // Initialize response object
    const outMsg: BasicResponse = {
      errorCode: '',
      userMessage: '',
      systemMessage: ''
    };
    
    return this.executeServiceMethod(
      outMsg,
      async () => {
        // Register poll
        const result = await this.inquiryRepository.register(inMsg.poll);
        
        if (result.s_error_code === 0) {
          // Aquí podrías enviar a un servicio MS si es necesario
          // await this.sendToMS(result.s_ct, inMsg.poll, header);
          
          this.setSuccessResponse(outMsg);
        } else {
          logger.error(`Error en SP: ${result.s_error_msg}`);
          outMsg.errorCode = String(result.s_error_code);
          outMsg.userMessage = 'OCURRIÓ UN ERROR AL CONSULTAR EL SERVICIO';
          outMsg.systemMessage = result.s_error_msg || 'OCURRIÓ UN ERROR AL CONSULTAR EL SERVICIO';
        }
      }
    );
  }
}