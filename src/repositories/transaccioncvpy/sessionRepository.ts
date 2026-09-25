import { executeStoredProcedure, executeStoredProcedureConfig, executeStoredProcedureSession } from '../../utils/dbmysql';
import { logger } from '../../utils/logger';
import { BaseRepository } from './BaseRepository';

export interface SessionLoginResult {
  s_status: number | null;
}

export interface ConfigurationResult {
  s_tiempovida: number;
  s_tiempovida_web: number;
  s_canttransc: number;
  s_infolegal: string;
  s_maxefectivo: string;
}

export class SessionRepository extends BaseRepository {

  async login(deviceId: number, ip: string): Promise<SessionLoginResult> {
    try {
      const params = [deviceId, ip, null]; // El último parámetro es para el OUT parameter
      
      // Log the request
      this.logRequestResponse('SessionRepository.login', params, null);
      
      const result = await executeStoredProcedureSession<any[]>('pa_cv_isesion', params);
      
      // Log the response
      this.logRequestResponse('SessionRepository.login', null, result);

      // Extract the result using the base class method
      const status = this.extractStoredProcedureResult<number | null>(result, null, 's_status');
      
      return { s_status: status };
    } catch (error) {
      return this.handleError<SessionLoginResult>(
        'login',
        error,
        { s_status: null }
      );
    }
  }
  
  async logout(sessionId: number, ipAgency: number): Promise<boolean> {
    try {
      const params = [sessionId, ipAgency];
      
      await executeStoredProcedure<any>('pa_cv_asesion', params);
      
      return true;
    } catch (error) {
      return this.handleError<boolean>('logout', error, false);
    }
  }

  async getConfigurations(): Promise<ConfigurationResult> {
    try {
      logger.info(`Iniciando obtención de configuraciones`);

      const resultArray = await executeStoredProcedureConfig<ConfigurationResult[]>('pa_cv_cconfiguration');
      const result = resultArray?.[0];

      logger.info(`RESPONSE SP`, result);
        return result;
    } catch (error) {
      logger.error('Error al obtener configuraciones:', error);
      throw error;
    }
  }
}