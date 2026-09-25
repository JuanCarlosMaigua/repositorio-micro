import { logger } from '../../utils/logger';
import { CuentaRepository } from '../../repositories/cuentacvpy/cuentaRepository';
import { OutMsgObtenerCuenta } from '../../models/cuentacvpy/outMsgObtenerCuenta';
import { Util } from '../../utils/response';

export class CuentaService {
    private readonly cuentaRepository: CuentaRepository;

    constructor() {
        this.cuentaRepository = new CuentaRepository();
    }

    async getAccount(accountNumber: string, headers: any): Promise<OutMsgObtenerCuenta> {
        const outMsg: OutMsgObtenerCuenta = {
            errorCode: Util.errCode,
            userMessage: Util.errMessage,
            systemMessage: Util.errMessage
        };

        try {
            // Validar número de cuenta
            if (!accountNumber || accountNumber.trim() === '') {
                outMsg.errorCode = Util.errCodeCtr;
                outMsg.userMessage = 'Número de cuenta requerido';
                outMsg.systemMessage = 'El número de cuenta es obligatorio';
                return outMsg;
            }

            // Llamar al repositorio para obtener la cuenta
            const response = await this.cuentaRepository.obtenerCuenta(accountNumber, headers);
 
            return response;
        } catch (error: any) {
            logger.error('Error en getAccount:', error);
            
            // Si es un error personalizado, usar sus propiedades
            if (error.errorCode && error.userMessage) {
                outMsg.errorCode = error.errorCode;
                outMsg.userMessage = error.userMessage;
                outMsg.systemMessage = error.message;
            } else {
                outMsg.errorCode = Util.errCode;
                outMsg.userMessage = Util.errMessage;
                outMsg.systemMessage = error.message || 'Error desconocido';
            }
            
            return outMsg;
        }
    }
}