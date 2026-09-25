import { logger } from '../../../utils/logger';
import { CustomError } from '../../../utils/tarjetacvpy/customError';
import { Util } from '../../../utils/response';
import { parseStringPromise, processors } from 'xml2js';
import { MensajeSalidaConsultarServicioBasico, TipoPersona } from '../../../models/recaudacioncvpy/ClienteModel/MensajeSalidaConsultarServicioBasico';
import { MensajeEntrada } from '../../../models/recaudacioncvpy/ClienteModel/MensajeEntradaConsultarRecaudacionAgua';
import { HttpClient } from '../../../utils/httpClient';

// URL para todos los servicios de recaudación
const RECAUDACIONCVMS_URL = process.env.RECAUDACIONCVMS_URL || '';
const RECAUDACIONCVMS_CONN_TIMEOUT = parseInt(process.env.RECAUDACIONCVMS_CONN_TIMEOUT || '30000', 10);
const SSL_CLIENTE = process.env.SSL_CLIENTE || 'false';

export abstract class BaseRecaudacionService<T extends MensajeEntrada> {
  private readonly httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient({
      url: RECAUDACIONCVMS_URL,
      timeout: RECAUDACIONCVMS_CONN_TIMEOUT,
      sslEnabled: SSL_CLIENTE,
      logPrefix: '[BaseRecaudacionService]',
      sanitizeResponse: false
    });
  }

  protected buildBaseSoapEnvelope(body: any, messageType: string, customFieldsBuilder?: (xml: string[]) => void): string {
    const xml: string[] = [];
    
    // Start envelope
    this.addEnvelopeHeader(xml, messageType);
    
    // Add common fields
    this.addCommonFields(xml, body);
    
    // Add parameters section
    this.addParametersSection(xml, body.parametros || {});
    
    // Add custom fields if provided
    if (customFieldsBuilder) {
      customFieldsBuilder(xml);
    }
    
    // Close envelope
    this.addEnvelopeFooter(xml, messageType);
    
  const soapEnvelope = xml.join('\n');
  logger.info(`[${messageType}] Envelope SOAP generado:`, soapEnvelope); 
  return soapEnvelope;
  }

  private addEnvelopeHeader(xml: string[], messageType: string): void {
    xml.push(
      `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v1="http://www.bolivariano.com/MensajesRecaudacionCV/v1.0">`,
      '    <soapenv:Header/>',
      '    <soapenv:Body>',
      `        <v1:${messageType}>`
    );
  }

  private addEnvelopeFooter(xml: string[], messageType: string): void {
    xml.push(
      `        </v1:${messageType}>`,
      '    </soapenv:Body>',
      '</soapenv:Envelope>'
    );
  }

  private addCommonFields(xml: string[], body: any): void {
    const commonFields = [
      'archivo', 'canal', 'depuracion', 'fecha', 
      'oficina', 'proceso', 'terminal', 'transaccion', 
      'secuencial', 'usuario'
    ];

    commonFields.forEach(field => {
      xml.push(`            <${field}>${body[field] || ''}</${field}>`);
    });
  }

  private addParametersSection(xml: string[], parametros: any): void {
    xml.push('            <parametros>');
    
    const parameterFields = [
      'aplicativoCobis', 'autorizacion', 'canalCobranza', 'servicio',
      'empresa', 'tipoMoneda', 'codigoSuministro', 'hora',
      'codigoTerminal', 'secuencial', 'consultaComision', 'monedaComision',
      'canalComision', 'fechaTransaccionLocal', 'servicioProveedor'
    ];

    parameterFields.forEach(field => {
      xml.push(`                <${field}>${parametros[field] || ''}</${field}>`);
    });
    
    xml.push('            </parametros>');
  }

  async obtenerConsulta(body: any, nameRecaudacion: string): Promise<MensajeSalidaConsultarServicioBasico | null> {
    try {
      logger.info(`Iniciando consulta de Recaudación ${nameRecaudacion}`);
      
      // Preparar el cuerpo de la solicitud SOAP
      const soapEnvelope = this.buildSoapEnvelope(body);

      // Realizar la petición usando HttpClient
      const responseData = await this.httpClient.post(soapEnvelope);
      
      // Procesar la respuesta
      const result = await this.processSoapResponse(responseData, nameRecaudacion);
      
      logger.info(`[BaseRecaudacionService] Consulta de ${nameRecaudacion} completada`);
      return result;
    } catch (error: any) {
      logger.error(`[BaseRecaudacionService] Error en consulta de Recaudacion ${nameRecaudacion}:`, error?.message || error);
      
      if (error.message === 'Request timed out') {
        throw new CustomError(Util.errCode, Util.errMessage, 'Request timed out');
      }
      
      throw new CustomError(
        Util.errCode, 
        Util.errMessage, 
        `Error al consultar RECAUDACION ${nameRecaudacion}: ${error.message}`

      );
    }
  }

  protected abstract buildSoapEnvelope(body: T): string;

  protected async processSoapResponse(soapResponse: string, nameRecaudacion: string): Promise<MensajeSalidaConsultarServicioBasico | null> {
    logger.info(`[${nameRecaudacion}] Procesando respuesta SOAP`);
    const sanitizedResponse = Util.sanitizeForLog(soapResponse);
    logger.info(`RESPONSE: ${sanitizedResponse}`);

    try {
      const result = await parseStringPromise(soapResponse, {
        explicitArray: false,
        tagNameProcessors: [processors.stripPrefix]
      });

      logger.info('Resultado XML parseado:', JSON.stringify(result, null, 2));

      const cuentaData = result?.Envelope?.Body?.MensajeSalidaConsultarServicioBasico;

      if (!cuentaData) {
        logger.error('No se encontró el nodo "MensajeSalidaConsultarServicioBasico" en la respuesta');
        return null;
      }

   logger.info('Objeto cuenta parseado:', cuentaData); 
  return this.mapToCuenta(cuentaData);
    } catch (error) {
      logger.error('Error al procesar la respuesta SOAP:', error);
      throw new CustomError(Util.errCode, Util.errMessage, 'Error al procesar la respuesta SOAP');
    }
  }
  
  // Opción 1: Separar en funciones auxiliares
protected mapToCuenta(soapResponse: any): MensajeSalidaConsultarServicioBasico | null {
  return {
    ...this.mapMensajeSalida(soapResponse),
    servicioBasico: this.mapServicioBasico(soapResponse.servicioBasico)
  };
}

private mapMensajeSalida(soapResponse: any) {
  return {
    codigoError: soapResponse.codigoError || '',
    mensajeUsuario: soapResponse.mensajeUsuario || '',
    mensajeSistema: soapResponse.mensajeSistema || '',
    estado: soapResponse.estado || '',
    codigoErrorRemoto: soapResponse.codigoErrorRemoto || '',
    operacion: soapResponse.operacion || '',
    secuencialBPM: soapResponse.secuencialBPM || 0,
    fechaProceso: soapResponse.fechaProceso || '',
    fechaTransaccion: soapResponse.fechaTransaccion || '',
    secuenciaTransaccion: soapResponse.secuenciaTransaccion || 0,
    offline: soapResponse.offline || ''
  };
}

private mapServicioBasico(servicioBasico: any) {
  return {
    deudaTotal: servicioBasico?.deudaTotal || 0,
    montoMinimo: servicioBasico?.montoMinimo || 0,
    comision: servicioBasico?.comision || 0,
    cliente: this.mapCliente(servicioBasico?.cliente)
  };
}

private mapCliente(cliente: any) {
  return {
    identificacion: cliente?.identificacion || '',
    tipoIdentificacion: cliente?.tipoIdentificacion,
    tipoPersona: cliente?.tipoPersona || TipoPersona.N,
    nombre: cliente?.nombre || '',
    enteMis: cliente?.enteMis || null,
    correo: cliente?.correo || '',
    telefono: cliente?.telefono || ''
  };
}

  
}