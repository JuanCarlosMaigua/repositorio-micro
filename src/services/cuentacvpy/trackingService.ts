// src/services/cuentacvpy/trackingService.ts
import { logger } from '../../utils/logger';
import { TrackingRepository } from '../../repositories/cuentacvpy/trackingRepository';
import { InMsgGenerarLogFrontEnd } from '../../models/cuentacvpy/inMsgGenerarLogFrontEnd';
import { BasicResponse } from '../../models/transaccioncvpy/common';
import { Util } from '../../utils/response';

export class TrackingService {
    private readonly trackingRepository: TrackingRepository;
    
    constructor() {
        this.trackingRepository = new TrackingRepository();
    }
    
    async registrarLog(mensajeEntrada: InMsgGenerarLogFrontEnd): Promise<BasicResponse> {
        const respuesta: BasicResponse = {
            errorCode: Util.errCode,
            userMessage: Util.errMessage,
            systemMessage: Util.errMessage
        };
        
        try {
            // Asegurar que timestamp está presente
            if (!mensajeEntrada.timestamp) {
                mensajeEntrada.timestamp = new Date().toISOString();
            }
            
            // Registrar log en Redis
            const resultado = await this.trackingRepository.registrarLog(mensajeEntrada);
            
            if (resultado) {
                respuesta.errorCode = Util.okCode;
                respuesta.userMessage = 'TRANSICION EXITOSA';
                respuesta.systemMessage = 'TRANSICION EXITOSA';
            }
            
            return respuesta;
        } catch (error) {
            logger.error('Error al registrar log:', error);
            return respuesta;
        } 
    }
}