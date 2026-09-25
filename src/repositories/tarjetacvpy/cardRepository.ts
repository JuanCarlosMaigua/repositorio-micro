import { logger } from '../../utils/logger';
import { CustomError } from '../../utils/tarjetacvpy/customError';
import { Util } from '../../utils/tarjetacvpy/util';
import { OutMsgGetCard } from '../../models/tarjetacvpy/outMsgGetCard';
import { parseStringPromise, processors } from 'xml2js';
import { Client } from '../../models/shared/client';
import { Util as ResponseUtil } from '../../utils/response';
import { HttpClient } from '../../utils/httpClient';

const TARJETACVMS_URL = process.env.TARJETACVMS_URL || '';
const SSL_CLIENTE = process.env.SSL_CLIENTE || 'false';
const TARJETACVMS_CONN_TIMEOUT = parseInt(process.env.TARJETACVMS_CONN_TIMEOUT || '30000', 10);

export class CardRepository {
    private readonly httpClient: HttpClient;

    constructor() {
        this.httpClient = new HttpClient({
            url: TARJETACVMS_URL,
            timeout: TARJETACVMS_CONN_TIMEOUT,
            sslEnabled: SSL_CLIENTE,
            logPrefix: '[cardRepository]',
            sanitizeResponse: false
        });
    }

    async consultarTarjetas(cliente: Client, headers: any): Promise<OutMsgGetCard | null> {
        try {
            logger.info('[cardRepository] Iniciando consulta de tarjetas');
 
            const soapEnvelope = this.buildSoapEnvelope(cliente, headers);
 
            const responseData = await this.httpClient.post(soapEnvelope);
 
            const result = await this.processSoapResponse(responseData, cliente.identification!);

            logger.info('[cardRepository] Consulta de tarjetas completada');
            return result;
        } catch (error: any) {
            logger.error('[cardRepository] Error en consulta de tarjetas:', error?.message || error);
            
            if (error.message === 'Request timed out') {
                throw new CustomError(Util.errCode, Util.errMessage, 'Request timed out');
            }
            
            throw new CustomError(Util.errCode, Util.errMessage, 'Error al consultar tarjetas: ' + error.message);
        }
    }

    private async processSoapResponse(soapResponse: string,identificacion: string): Promise<OutMsgGetCard | null> {

        logger.info('[cardRepository] Procesando respuesta SOAP', ResponseUtil.sanitizeForLog(soapResponse));
    
        try {
            const result = await parseStringPromise(soapResponse, {
                explicitArray: false,
                tagNameProcessors: [processors.stripPrefix]
              });

            logger.info('Resultado XML parseado:', JSON.stringify(result, null, 2)); 

            const cuentaData = result?.Envelope?.Body?.MensajeSalidaConsultarTarjetas;
    
            if (!cuentaData) {
                logger.error('No se encontró el nodo "MensajeSalidaConsultarTarjetas" en la respuesta');
                return null;
            }
    
            logger.info('Objeto cuenta parseado:', cuentaData); 
            return this.mapToCuenta(cuentaData,identificacion);
        } catch (error) {
            logger.error('Error al procesar la respuesta SOAP:', error);
            throw new CustomError(Util.errCode, Util.errMessage, 'Error al procesar la respuesta SOAP');
        }
    }
    

    mapToCuenta(soapResponse: any, requestIdentification?: string): OutMsgGetCard | null {
        const outMsg: OutMsgGetCard = this.createBaseOutMsg(soapResponse, requestIdentification);
        
        if (soapResponse.codigoError !== '0') {
            return outMsg;
        }
        
        const tarjetas = this.extractTarjetas(soapResponse);
        const filteredCards = this.filterValidCards(tarjetas);
        
        if (filteredCards.length > 0) {
            outMsg.client = this.mapClientInfo(soapResponse.cliente, requestIdentification);
        }
        
        outMsg.creditCards = this.mapCreditCards(filteredCards);
        
        return outMsg;
    }
    
    private createBaseOutMsg(soapResponse: any, requestIdentification?: string): OutMsgGetCard {
        return {
            errorCode: soapResponse.codigoError || '',
            userMessage: soapResponse.mensajeUsuario || '',
            systemMessage: soapResponse.mensajeSistema || '',
            client: {
                identification: requestIdentification || '',
                name: soapResponse.cliente?.nombreCompleto || '',
            },
            creditCards: []
        };
    }
    
    private extractTarjetas(soapResponse: any): any[] {
        const tarjetasCredito = soapResponse.tarjetasCredito?.tarjetaCredito;
        if (!tarjetasCredito) return [];
        
        return Array.isArray(tarjetasCredito) ? tarjetasCredito : [tarjetasCredito];
    }
    
    private filterValidCards(tarjetas: any[]): any[] {
        return tarjetas.filter((card: any) => !card.marca?.includes('REL'));
    }
    
    private mapClientInfo(clientInfo: any, requestIdentification?: string): any {
        if (!clientInfo) {
            return {
                identification: requestIdentification || '',
                name: '',
            };
        }
        
        return {
            identification: requestIdentification || '',
            name: clientInfo.nombreCompleto || '',
            mail: clientInfo.correoElectronico || '',
            phone: clientInfo.descripcion || ''
        };
    }
    
    private mapCreditCards(cards: any[]): any[] {
        return cards.map((card: any) => ({
            cardKey: card.codigoUnico || '',
            cardNumber: card.numeroEnmascarado || '',
            cardType: card.tipo || '',
            cardBrand: this.extractCardBrand(card.marca),
            own: this.isOwnCard(card.marca)
        }));
    }
    
    private extractCardBrand(marca: string): string {
        if (!marca) return '';
        return marca.split('_')[0] || '';
    }
    
    private isOwnCard(marca: string): boolean {
        return !marca?.includes('ADIC');
    }

   


    private buildSoapEnvelope(cliente: Client, headers: any): string {
        const secuencial: string = headers.secuencial ?? Date.now().toString();
        
        const fecha: string = new Date().toISOString();

        return `<?xml version="1.0" encoding="UTF-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v1="http://www.bolivariano.com/MensajesTarjetaCV/v1.0">
       <soapenv:Header/>
       <soapenv:Body>
          <v1:MensajeEntradaConsultarTarjetas>
             <archivo>${headers.archivo || ''}</archivo>
             <canal>${headers.canal || 'VEN'}</canal>
             <depuracion>${headers.depuracion || ''}</depuracion>
             <fecha>${fecha || ''}</fecha>
             <oficina>${headers.oficina || ''}</oficina>
             <proceso>${headers.proceso || ''}</proceso>
             <terminal>${headers.terminal || ''}</terminal>
             <transaccion>${headers.transaccion || ''}</transaccion>
             <secuencial>${secuencial || ''}</secuencial>
             <usuario>${headers.usuario || ''}</usuario>
             <cliente>
                ${this.buildClienteXml(cliente)}
             </cliente>
          </v1:MensajeEntradaConsultarTarjetas>
       </soapenv:Body>
    </soapenv:Envelope>`;
    }
    
    private buildClienteXml(cliente: Client): string {
        let xml = '';
        // Identificaciones
            xml += `<identificaciones>
                    <fechaCaducidad></fechaCaducidad>
                    <fechaCreacion></fechaCreacion>
                    <identificacion>${cliente.identification || ''}</identificacion>
                    <tipoIdentificacion>${cliente.identificationType || ''}</tipoIdentificacion>
                </identificaciones>`;
        return xml;
    }




}