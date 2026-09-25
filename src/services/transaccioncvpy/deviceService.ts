import { InMsgSaveDevice, OutMsgSaveDevice } from '../../models/transaccioncvpy/device';
import { DeviceRepository } from '../../repositories/transaccioncvpy/deviceRepository';
import { logger } from '../../utils/logger';
import { BaseService } from './BaseService';

export class DeviceService extends BaseService {
  private readonly deviceRepository: DeviceRepository;
  
  constructor() {
    super();
    this.deviceRepository = new DeviceRepository();
  }
  

  async saveDevice(inMsg: InMsgSaveDevice): Promise<OutMsgSaveDevice> {
    // Initialize response object
    const outMsg: OutMsgSaveDevice = {
      errorCode: '',
      userMessage: '',
      systemMessage: ''
    };
    
    return this.executeServiceMethod(
      outMsg,
      async () => {
        // Register the device
        const result = await this.deviceRepository.register(
          inMsg.device.uuId,
          inMsg.device.operatingSystem
        );
        
        if (result.s_status !== null) {
          // Get configuration data
          outMsg.configuration = await this.getConfigurationData();
          
          // Set device data with ID
          outMsg.device = {
            ...inMsg.device,
            deviceId: result.s_status
          };
          
          this.setSuccessResponse(outMsg);
        } else {
          logger.error('Error al ingresar dispositivo');
          this.setControllerErrorResponse(outMsg);
        }
      }
    );
  }
}