import { logger } from '../../utils/logger';
import { CustomError } from '../../utils/tarjetacvpy/customError';
import { Util } from '../../utils/response';
import { parseStringPromise,processors  } from 'xml2js';
import { OutMsgObtenerCuenta } from '../../models/cuentacvpy/outMsgObtenerCuenta';
import { HttpClient } from '../../utils/httpClient';

const CUENTACVMS_URL = process.env.CUENTACVMS_URL || '';
const CUENTACVMS_CONN_TIMEOUT = parseInt(process.env.CUENTACVMS_CONN_TIMEOUT || '8000', 10);
const SSL_CLIENTE = process.env.SSL_CLIENTE || 'false';
  
 
export class CuentaRepository {
    private readonly httpClient: HttpClient;

    constructor() {
        this.httpClient = new HttpClient({
            url: CUENTACVMS_URL,
            timeout: CUENTACVMS_CONN_TIMEOUT,
            sslEnabled: SSL_CLIENTE,
            logPrefix: '[cuentaRepository]',
            sanitizeResponse: false
        });
    }

    async obtenerCuenta(accountNumber: string, headers: any): Promise<any> {
        try {
            logger.info('[cuentaRepository] Iniciando consulta de cuenta');

            const soapEnvelope = this.buildSoapEnvelope(accountNumber, headers);
 
            const responseData = await this.httpClient.post(soapEnvelope);
 
            const result = await this.processSoapResponse(responseData);

            logger.info('Consulta de cuenta completada');
            return result;
        } catch (error: any) {
            logger.error('[cuentaRepository] Error en consulta de cuenta:', error?.message || error);
             
            if (error.message === 'Request timed out') {
                throw new CustomError(Util.errCode, Util.errMessage, 'Request timed out');
            }
            
            throw new CustomError(Util.errCode, Util.errMessage, 'Error al consultar cuenta: ' + error.message);
        }
    }

    private buildSoapEnvelope(accountNumber: string, headers: any): string {
        // Construir un envelope SOAP completo con WS-Security
        // En una implementación real, esta lógica sería más compleja para incluir seguridad WS
        const soapEnvelope = 
        `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v1="http://www.bolivariano.com/MensajesCuentaCV/v1.0">
           <soapenv:Header/>
           <soapenv:Body>
              <v1:MensajeEntradaObtenerCuenta>
                 <canal>${headers.canal || 'VEN'}</canal>
                 <fecha>${new Date().toISOString()}</fecha>
                 <terminal>${headers.terminal || ''}</terminal>
                 <secuencial>${headers.secuencial || ''}</secuencial>
                 <transaccion>${headers.transaccion || ''}</transaccion>
                 <numeroCuenta>${accountNumber}</numeroCuenta>
              </v1:MensajeEntradaObtenerCuenta>
           </soapenv:Body>
        </soapenv:Envelope>`;

        const sanitizedResponse = Util.sanitizeForLog(soapEnvelope);
        logger.info(`[cuentaRepository] Envelope SOAP generado: ${sanitizedResponse}`);
        return soapEnvelope;
    }

    
    private async processSoapResponse(soapResponse: string): Promise<OutMsgObtenerCuenta | null> {
        logger.info('[cuentaRepository] Procesando respuesta SOAP');
        const sanitizedResponse = Util.sanitizeForLog(soapResponse);
        logger.info(`RESPONSE: ${sanitizedResponse}`);    
        try {
            const result = await parseStringPromise(soapResponse, {
                explicitArray: false,
                tagNameProcessors: [processors.stripPrefix]
              });
 
             
            const cuentaData = result?.Envelope?.Body?.MensajeSalidaObtenerCuenta;
    
            if (!cuentaData) {
                logger.error('No se encontró el nodo "MensajeSalidaObtenerCuenta" en la respuesta');
                return null;
            }
     
            return this.mapToCuenta(cuentaData);
        } catch (error) {
            logger.error('Error al procesar la respuesta SOAP:', error);
            throw new CustomError(Util.errCode, Util.errMessage, 'Error al procesar la respuesta SOAP');
        }
    }
    

    // Método para mapear la respuesta SOAP a nuestro modelo Cuenta
    mapToCuenta(soapResponse: any): OutMsgObtenerCuenta | null {
        return {
            errorCode: soapResponse.codigoError || '',
            userMessage: soapResponse.mensajeUsuario || '',
            systemMessage: soapResponse.mensajeSistema || '',
            account: {
                accountName: soapResponse.nombre || '', 
                accountNumber: soapResponse.numeroCuenta || '',
                accountTypeCode: soapResponse.tipo || 0,
                accountOwnerDNI: soapResponse.dni || '',
                mail: soapResponse.mail || '',
                phone: soapResponse.phone || ''
            }
        };
    }
}