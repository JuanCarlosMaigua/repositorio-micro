import { executeStoredProcedureDevice } from '../../utils/dbmysql';
import { BaseRepository } from './BaseRepository';

export interface DeviceRegistrationResult {
  s_status: number | null;
}

export class DeviceRepository extends BaseRepository {
  /**
   * Register a new device
   * @param uuid Device unique identifier
   * @param deviceOs Operating system of the device
   * @returns Registration result with status code
   */
  async register(uuid: string, deviceOs: string): Promise<DeviceRegistrationResult> {
    try {
      // Convertir 'null' o cadena vacía a null
      const cleanedUuid = (uuid === 'null' || uuid === '') ? null : uuid;
      
      // Parámetros para el procedimiento almacenado
      const params = [cleanedUuid, deviceOs, null]; // El último parámetro es para el OUT parameter s_status
      
      // Log the request parameters
      this.logRequestResponse('DeviceRepository.register', params, null);
      
      // Ejecutar el procedimiento almacenado
      const result = await executeStoredProcedureDevice<any[]>('pa_cv_idevice', params);
      
      // Log the response
      this.logRequestResponse('DeviceRepository.register', null, result);
      
      // Extract the result using the base class method
      const status = this.extractStoredProcedureResult<number | null>(result, null, 's_status');
      
      return { s_status: status };
    } catch (error) {
      return this.handleError<DeviceRegistrationResult>(
        'register', 
        error, 
        { s_status: null }
      );
    }
  }
}