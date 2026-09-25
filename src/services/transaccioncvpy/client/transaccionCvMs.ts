import { parseStringPromise, processors } from "xml2js";
import { logger } from "../../../utils/logger";
import { CustomError } from "../../../utils/tarjetacvpy/customError";
import { Util } from "../../../utils/response";
import { MensajeEntradaGuardarTransaccion, MensajeSalidaGuardarTransaccion } from "../../../models/transaccioncvpy/paycard";
import { HttpClient } from "../../../utils/httpClient";

const TRANSACCIONCVMS_URL = process.env.TRANSACCIONCVMS_URL || "";
const TRANSACCIONCVMS_CONN_TIMEOUT = parseInt(process.env.TARJETACVMS_CONN_TIMEOUT || "8000", 10);
const SSL_CLIENTE = process.env.SSL_CLIENTE || 'false';

export class TransaccionCvMs {
    private readonly httpClient: HttpClient;
    private readonly readTimeout: number;
    private readonly username: string;
    private readonly password: string;
    private readonly encryptUsername: string;

    constructor() {
        this.httpClient = new HttpClient({
            url: TRANSACCIONCVMS_URL,
            timeout: TRANSACCIONCVMS_CONN_TIMEOUT,
            sslEnabled: SSL_CLIENTE,
            logPrefix: '[TransaccionCvMs]',
            sanitizeResponse: false
        });
        this.readTimeout = parseInt(process.env.TARJETACVMS_READ_TIMEOUT || "25000", 10);
        this.username = process.env.SERVICE_CAMEL_USERNAME || "";
        this.password = process.env.SERVICE_CAMEL_PASSWORD || "";
        this.encryptUsername = process.env.SERVICE_CAMEL_ENCRYP_USERNAME || "";
    }

    async guardarTransaccion(/*headers: any,*/inTransaction: MensajeEntradaGuardarTransaccion): Promise<MensajeSalidaGuardarTransaccion | null> { 
        try {
            logger.info("Iniciando Guardar Transaccion");
 
            const soapEnvelope = this.buildSoapEnvelope(inTransaction);
            const sanitizedRequest = Util.sanitizeForLog(soapEnvelope);
            logger.info("[TransaccionCvMs] REQUEST XML: " + sanitizedRequest);
 
            const responseData = await this.httpClient.post(soapEnvelope);

            // Procesar la respuesta
            const result = await this.processSoapResponse(responseData);
            
            logger.info("[TransaccionCvMs] Guardar transaccion completado");
            return result;
        } catch (error: any) {
            logger.error("[TransaccionCvMs] Error en guardar transaccion:", error?.message || error);
            
            if (error.message === 'Request timed out') {
                throw new CustomError(Util.errCode, Util.errMessage, 'Request timed out');
            }
            
            throw new CustomError(
                Util.errCode,
                Util.errMessage,
                "Error al guardar transaccion: " + error.message
            );
        }
    }

    private async processSoapResponse(soapResponse: string): Promise<MensajeSalidaGuardarTransaccion | null> {
        logger.info("[transaccionCvMs] Procesando respuesta SOAP", Util.sanitizeForLog(soapResponse));

        try {
            const result = await parseStringPromise(soapResponse, {
                explicitArray: false,
                tagNameProcessors: [processors.stripPrefix],
            });

            const transaccionData = result?.Envelope?.Body?.MensajeSalidaGuardarTransaccion;

            if (!transaccionData) {
                logger.error(
                    'No se encontró el nodo "MensajeSalidaGuardarTransaccion" en la respuesta'
                );
                return null;
            }

            return this.mapToCuenta(transaccionData);
        } catch (error) {
            logger.error("Error al procesar la respuesta SOAP:", error);
            throw new CustomError(
                Util.errCode,
                Util.errMessage,
                "Error al procesar la respuesta SOAP"
            );
        }
    }

    private mapToCuenta(soapResponse: any): MensajeSalidaGuardarTransaccion {
        // Crear y devolver un objeto de respuesta
        const outTransaction: MensajeSalidaGuardarTransaccion = {
          codigoError: soapResponse.codigoError || '',
          codigoErrorRemoto: soapResponse.codigoErrorRemoto || '',
          estado: soapResponse.estado || '',
          mensajeSistema: soapResponse.mensajeSistema || '',
          mensajeUsuario: soapResponse.mensajeUsuario || '',
          operacion: soapResponse.operacion || '',
          secuencialBPM: soapResponse.secuencialBPM || null,
          fechaProceso: soapResponse.fechaProceso || null,
          fechaTransaccion: soapResponse.fechaTransaccion || null,
          secuenciaTransaccion: soapResponse.secuenciaTransaccion || null,
          offline: soapResponse.offline || ''
        }
     logger.info('Response Guardar transaccion: ', outTransaction); 
        return outTransaction;
    }

    private buildSoapEnvelope(inTransaction: MensajeEntradaGuardarTransaccion): string {
        const fecha: string = new Date().toISOString();

        return `<?xml version="1.0" encoding="UTF-8"?>
                <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v1="http://www.bolivariano.com/MensajesTransaccionCV/v1.0">
                <soapenv:Header/>
                <soapenv:Body>
                    <v1:MensajeEntradaGuardarTransaccion>
                        <archivo>${inTransaction.archivo || ""}</archivo>
                        <canal>${inTransaction.canal}</canal>
                        <depuracion>${inTransaction.depuracion || ""}</depuracion>
                        <fecha>${fecha}</fecha>
                        <oficina>${inTransaction.oficina || ""}</oficina>
                        <proceso>${inTransaction.proceso || ""}</proceso>
                        <terminal>${inTransaction.terminal || ""}</terminal>
                        <transaccion>${inTransaction.transaccion || ""}</transaccion>
                        <secuencial>${inTransaction.secuencial}</secuencial>
                        <usuario>${inTransaction.usuario || ""}</usuario>
                        <transaccionCliente>
                            ${this.buildTransaccionClienteXml(inTransaction)}
                        </transaccionCliente>
                    </v1:MensajeEntradaGuardarTransaccion>
                </soapenv:Body>
                </soapenv:Envelope>`;
    }

    // Modificación para buildTransaccionClienteXml
// OPCIÓN 1 COMPLETA: Métodos Helper - Complejidad Cognitiva: ~12
// ================================================================

private buildTransaccionClienteXml(inTransaction: MensajeEntradaGuardarTransaccion): string {
    const data = inTransaction.transaccionCliente;
    
    let xml = this.buildBasicFields(data, inTransaction.fecha ?? '');
    xml += this.buildDispositivoXml(data.dispositivo);
    xml += this.buildDepositanteXml(data.depositante);
    xml += this.buildCuentaXml(data.cuenta);
    xml += this.buildTarjetaXml(data.tarjeta);
    xml += this.buildServicioXml(data.servicio);
    logger.info(`TransaccionCliente: ${xml}`);
    return xml;
}

private buildBasicFields(data: any, fecha: string): string {
    return `<idTransaccion>${data.idTransaccion || ''}</idTransaccion>
               <codigoCT>${data.codigoCT || ''}</codigoCT>
               <fechaCreacion>${fecha || ''}</fechaCreacion>
               <tiempoMaximo>${data.tiempoMaximo || ''}</tiempoMaximo>
               <tipoTransaccion>${data.tipoTransaccion || ''}</tipoTransaccion>
               <idTipoTransaccion>${data.idTipoTransaccion || ''}</idTipoTransaccion>
               <tipoAcceso>${data.tipoAcceso || ''}</tipoAcceso>`;
}

private buildDispositivoXml(dispositivo: any): string {
    const fields = dispositivo ? {
        identificador: dispositivo.identificador || '',
        sistemaOperativo: dispositivo.sistemaOperativo || '',
        ip: dispositivo.ip || ''
    } : { 
        identificador: '', 
        sistemaOperativo: '', 
        ip: '' 
    };

    return `<dispositivo>
                <identificador>${fields.identificador}</identificador>
                <sistemaOperativo>${fields.sistemaOperativo}</sistemaOperativo>
                <ip>${fields.ip}</ip>
                </dispositivo>`;
}

private buildDepositanteXml(depositante: any): string {
    const fields = depositante ? {
        identificacion: depositante.identificacion || '',
        tipoIdentificacion: depositante.tipoIdentificacion || '',
        tipoPersona: depositante.tipoPersona || '',
        nombre: depositante.nombre || '',
        enteMis: depositante.enteMis || '',
        correo: depositante.correo || '',
        telefono: depositante.telefono || ''
    } : {
        identificacion: '', 
        tipoIdentificacion: '', 
        tipoPersona: '',
        nombre: '', 
        enteMis: '', 
        correo: '', 
        telefono: ''
    };

    return `<depositante>
                <identificacion>${fields.identificacion}</identificacion>
                <tipoIdentificacion>${fields.tipoIdentificacion}</tipoIdentificacion>
                <tipoPersona>${fields.tipoPersona}</tipoPersona>
                <nombre>${fields.nombre}</nombre>
                <enteMis>${fields.enteMis}</enteMis>
                <correo>${fields.correo}</correo>
                <telefono>${fields.telefono}</telefono>
                </depositante>`;
}

private buildClienteXml(cliente: any): string {
    const fields = cliente ? {
        identificacion: cliente.identificacion || '',
        tipoIdentificacion: cliente.tipoIdentificacion || '',
        tipoPersona: cliente.tipoPersona || '',
        nombre: cliente.nombre || '',
        enteMis: cliente.enteMis || '',
        correo: cliente.correo || '',
        telefono: cliente.telefono || ''
    } : {
        identificacion: '', 
        tipoIdentificacion: '', 
        tipoPersona: '',
        nombre: '', 
        enteMis: '', 
        correo: '', 
        telefono: ''
    };

    return `<cliente>
                <identificacion>${fields.identificacion}</identificacion>
                <tipoIdentificacion>${fields.tipoIdentificacion}</tipoIdentificacion>
                <tipoPersona>${fields.tipoPersona}</tipoPersona>
                <nombre>${fields.nombre}</nombre>
                <enteMis>${fields.enteMis}</enteMis>
                <correo>${fields.correo}</correo>
                <telefono>${fields.telefono}</telefono>
                </cliente>`;
}

private buildCuentaXml(cuenta: any): string {
    let xml = `<cuenta>`;
    xml += this.buildClienteXml(cuenta?.cliente);
    
    const cuentaFields = {
        numeroCuenta: cuenta?.numeroCuenta || '',
        tipoCuenta: cuenta?.tipoCuenta || '',
        montoEfectivo: cuenta?.montoEfectivo || '',
        montoCheque: cuenta?.montoCheque || '',
        cantidadCheque: cuenta?.cantidadCheque || '',
        fondoOrigen: cuenta?.fondoOrigen || '',
        fondoDestino: cuenta?.fondoDestino || ''
    };
    
    xml += `<numeroCuenta>${cuentaFields.numeroCuenta}</numeroCuenta>
            <tipoCuenta>${cuentaFields.tipoCuenta}</tipoCuenta>
            <montoEfectivo>${cuentaFields.montoEfectivo}</montoEfectivo>
            <montoCheque>${cuentaFields.montoCheque}</montoCheque>
            <cantidadCheque>${cuentaFields.cantidadCheque}</cantidadCheque>
            <fondoOrigen>${cuentaFields.fondoOrigen}</fondoOrigen>
            <fondoDestino>${cuentaFields.fondoDestino}</fondoDestino>
            </cuenta>`;
    
    return xml;
}

private buildTarjetaXml(tarjeta: any): string {
    let xml = `<tarjeta>`;
    xml += this.buildClienteXml(tarjeta?.cliente);
    
    const tarjetaFields = {
        numeroTarjeta: tarjeta?.numeroTarjeta || '',
        codigoUnico: tarjeta?.codigoUnico || '',
        tipo: tarjeta?.tipo || '',
        marca: tarjeta?.marca || '',
        montoEfectivo: tarjeta?.montoEfectivo || '',
        cantidadCheque: tarjeta?.cantidadCheque || '',
        montoChequeBb: tarjeta?.montoChequeBb || '',
        montoChequeOb: tarjeta?.montoChequeOb || '',
        totalChequesExterior: tarjeta?.totalChequesExterior || '',
        montoChequeMi: tarjeta?.montoChequeMi || '',
        montoChequeNy: tarjeta?.montoChequeNy || '',
        montoChequeOp: tarjeta?.montoChequeOp || '',
        montoTotal: tarjeta?.montoTotal || '',
        fondoOrigen: tarjeta?.fondoOrigen || '',
        fondoDestino: tarjeta?.fondoDestino || ''
    };
    
    xml += `<numeroTarjeta>${tarjetaFields.numeroTarjeta}</numeroTarjeta>
            <codigoUnico>${tarjetaFields.codigoUnico}</codigoUnico>
            <tipo>${tarjetaFields.tipo}</tipo>
            <marca>${tarjetaFields.marca}</marca>
            <montoEfectivo>${tarjetaFields.montoEfectivo}</montoEfectivo>
            <cantidadCheque>${tarjetaFields.cantidadCheque}</cantidadCheque>
            <montoChequeBb>${tarjetaFields.montoChequeBb}</montoChequeBb>
            <montoChequeOb>${tarjetaFields.montoChequeOb}</montoChequeOb>
            <totalChequesExterior>${tarjetaFields.totalChequesExterior}</totalChequesExterior>
            <montoChequeMi>${tarjetaFields.montoChequeMi}</montoChequeMi>
            <montoChequeNy>${tarjetaFields.montoChequeNy}</montoChequeNy>
            <montoChequeOp>${tarjetaFields.montoChequeOp}</montoChequeOp>
            <montoTotal>${tarjetaFields.montoTotal}</montoTotal>
            <fondoOrigen>${tarjetaFields.fondoOrigen}</fondoOrigen>
            <fondoDestino>${tarjetaFields.fondoDestino}</fondoDestino>
            </tarjeta>`;
    
    return xml;
}

private buildServicioXml(servicio: any): string {
    let xml = `<servicio>`;
    xml += this.buildClienteXml(servicio?.cliente);
    xml += this.buildEmpresaXml(servicio?.empresa);
    
    const servicioFields = {
        codigoServicio: servicio?.codigoServicio ?? '',
        cantidadCheque: servicio?.cantidadCheque ?? '',
        factura: servicio?.factura ?? '',
        comision: servicio?.comision ?? '',
        montoEfectivo: servicio?.montoEfectivo ?? '',
        montoCheque: servicio?.montoCheque ?? '',
        montoTotal: servicio?.montoTotal ?? '',
        montoMinimo: servicio?.montoMinimo ?? '',
        deutaTotal: servicio?.deutaTotal ?? '',
        fondoOrigen: servicio?.fondoOrigen ?? '',
        fondoDestino: servicio?.fondoDestino ?? ''
    };
    
    xml += `<codigoServicio>${servicioFields.codigoServicio}</codigoServicio>
            <cantidadCheque>${servicioFields.cantidadCheque}</cantidadCheque>
            <factura>${servicioFields.factura}</factura>
            <comision>${servicioFields.comision}</comision>
            <montoEfectivo>${servicioFields.montoEfectivo}</montoEfectivo>
            <montoCheque>${servicioFields.montoCheque}</montoCheque>
            <montoTotal>${servicioFields.montoTotal}</montoTotal>
            <montoMinimo>${servicioFields.montoMinimo}</montoMinimo>
            <deutaTotal>${servicioFields.deutaTotal}</deutaTotal>
            <fondoOrigen>${servicioFields.fondoOrigen}</fondoOrigen>
            <fondoDestino>${servicioFields.fondoDestino}</fondoDestino>
            </servicio>`;
    
    return xml;
}

private buildEmpresaXml(empresa: any): string {
    if (!empresa) {
        return this.buildEmptyEmpresaXml();
    }
    
    let xml = `<empresa>
                <idEmpresa>${empresa.idEmpresa || ''}</idEmpresa>
                <nombreEmpresa>${empresa.nombreEmpresa || ''}</nombreEmpresa>
                <idServicio>${empresa.idServicio || ''}</idServicio>
                <nombreServicio>${empresa.nombreServicio || ''}</nombreServicio>`;
    
    xml += this.buildTiposXml(empresa.tipo);
    xml += this.buildRegionesXml(empresa.region);
    xml += this.buildAreasXml(empresa.area);
    xml += `</empresa>`;
    
    return xml;
}

private buildEmptyEmpresaXml(): string {
    return `<empresa>
                <idEmpresa></idEmpresa>
                <nombreEmpresa></nombreEmpresa>
                <idServicio></idServicio>
                <nombreServicio></nombreServicio>
                <tipo>
                <nemonico></nemonico>
                <catalogo>
                <clave></clave>
                <valor></valor>
                </catalogo>
                </tipo>
                <region>
                <nemonico></nemonico>
                <catalogo>
                <clave></clave>
                <valor></valor>
                </catalogo>
                </region>
                <area>
                <nemonico></nemonico>
                <catalogo>
                <clave></clave>
                <valor></valor>
                </catalogo>
                </area>
                </empresa>`;
}

private buildTiposXml(tipos: any[]): string {
    if (!tipos || !Array.isArray(tipos)) {
        return `<tipo>
                <nemonico></nemonico>
                <catalogo>
                <clave></clave>
                <valor></valor>
                </catalogo>
                </tipo>`;
    }
    
    return tipos.map(tipo => {
        let xml = `<tipo>
                   <nemonico>${tipo.nemonico || ''}</nemonico>`;
        xml += this.buildCatalogosXml(tipo.catalogo);
        xml += `</tipo>`;
        return xml;
    }).join('');
}

private buildRegionesXml(regiones: any[]): string {
    if (!regiones || !Array.isArray(regiones)) {
        return `<region>
                <nemonico></nemonico>
                <catalogo>
                <clave></clave>
                <valor></valor>
                </catalogo>
                </region>`;
    }
    
    return regiones.map(region => {
        let xml = `<region>
                   <nemonico>${region.nemonico || ''}</nemonico>`;
        xml += this.buildCatalogosXml(region.catalogo);
        xml += `</region>`;
        return xml;
    }).join('');
}

private buildAreasXml(areas: any[]): string {
    if (!areas || !Array.isArray(areas)) {
        return `<area>
                <nemonico></nemonico>
                <catalogo>
                <clave></clave>
                <valor></valor>
                </catalogo>
                </area>`;
    }
    
    return areas.map(area => {
        let xml = `<area>
                   <nemonico>${area.nemonico || ''}</nemonico>`;
        xml += this.buildCatalogosXml(area.catalogo);
        xml += `</area>`;
        return xml;
    }).join('');
}

private buildCatalogosXml(catalogos: any[]): string {
    if (!catalogos || !Array.isArray(catalogos)) {
        return `<catalogo>
                <clave></clave>
                <valor></valor>
                </catalogo>`;
    }
    
    return catalogos.map(catalogo => {
        return `<catalogo>
                <clave>${catalogo.clave || ''}</clave>
                <valor>${catalogo.valor || ''}</valor>
                </catalogo>`;
    }).join('');
}


}
