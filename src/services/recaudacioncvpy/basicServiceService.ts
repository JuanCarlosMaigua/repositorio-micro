import { logger } from '../../utils/logger';
import { BasicServiceRepository } from '../../repositories/recaudacioncvpy/basicServiceRepository';
import { InMsgGetBasicService } from '../../models/recaudacioncvpy/InMsgGetBasicService';
import { OutMsgGetBasicService } from '../../models/recaudacioncvpy/OutMsgGetBasicService';
import { BasicService } from '../../models/recaudacioncvpy/BasicService';
import { Client } from '../../models/shared/client';
import { getCatalog, getCatalogCompanyAttr } from './cache';
import { Util } from '../../utils/response';
import { RecaudacionAgua } from './ServiciosWebRecaudaciones/RecaudacionAgua';
import { MensajeEntrada, MensajeEntradaConsultarRecaudacionAgua, Parametros } from '../../models/recaudacioncvpy/ClienteModel/MensajeEntradaConsultarRecaudacionAgua';
import { MensajeSalidaConsultarServicioBasico, ServicioBasico } from '../../models/recaudacioncvpy/ClienteModel/MensajeSalidaConsultarServicioBasico';
import { CoreRecaudacion, MensajeEntradaConsultarMEER } from '../../models/recaudacioncvpy/ClienteModel/MensajeEntradaConsultarMEER';
import { MensajeEntradaConsultarInteragua } from '../../models/recaudacioncvpy/ClienteModel/MensajeEntradaConsultarInteragua';
import { MensajeEntradaConsultarEtapa } from '../../models/recaudacioncvpy/ClienteModel/MensajeEntradaConsultarEtapa';
import { Meer } from './ServiciosWebRecaudaciones/Meer';
import { Interagua } from './ServiciosWebRecaudaciones/Interagua';
import { Etapa } from './ServiciosWebRecaudaciones/Etapa';
import { MensajeEntradaConsultarCNT } from '../../models/recaudacioncvpy/ClienteModel/MensajeEntradaConsultarCNT';
import { Cnt } from './ServiciosWebRecaudaciones/Cnt';
import { MensajeEntradaConsultarCNEL } from '../../models/recaudacioncvpy/ClienteModel/MensajeEntradaConsultarCNEL';
import { Cnel } from './ServiciosWebRecaudaciones/Cnel';


export class BasicServiceService {
  private readonly basicServiceRepository: BasicServiceRepository;
  private readonly recaudacionAgua: RecaudacionAgua;
  private readonly meer: Meer;
  private readonly interagua: Interagua;
  private readonly etapa: Etapa;
  private readonly cnt: Cnt;
  private readonly cnel: Cnel;

  constructor() {
    this.basicServiceRepository = new BasicServiceRepository();
    this.recaudacionAgua = new RecaudacionAgua();
    this.meer = new Meer();
    this.interagua = new Interagua();
    this.etapa = new Etapa();
    this.cnt = new Cnt();
    this.cnel = new Cnel();
  }

  async getBasicService(inMs: InMsgGetBasicService): Promise<OutMsgGetBasicService> {
    logger.info(`Iniciando getBasicService para compañía ID: ${inMs?.company?.idCompany}`);
  
    const outMs: OutMsgGetBasicService = {
      errorCode: Util.errCode,
      userMessage: Util.errMessage,
      systemMessage: Util.errMessage
    };
  
    try {
      // Validaciones básicas
      if (!inMs.company?.idCompany) {
        logger.error('Se requiere compañía - parámetro inválido');
        throw new Error("Se requiere compañía");
      }
  
      if (!inMs.serviceCode) {
        logger.error('Se requiere código de servicio - parámetro inválido');
        throw new Error("Se requiere código de servicio");
      }
  
      const idCompany = inMs.company.idCompany;
  
      logger.info(`Preparando fetchCompanyAttr para idCompany: ${idCompany}`);
      const fetchCompanyAttr = async (id: number): Promise<Record<string, string>> => {
        try {
          logger.info(`Ejecutando basicServiceRepository.getCompanyAttr para idCompany: ${id}`);
          const attrs = await this.basicServiceRepository.getCompanyAttr(id);
          logger.info(`Atributos obtenidos para idCompany ${id}: ${JSON.stringify(attrs)}`);
          return attrs;
        } catch (error) {
          logger.error(`Error al obtener atributos para idCompany ${id}:`, error);
          throw error;
        }
      };
  
      logger.info(`Llamando a getCatalogCompanyAttr (caché o repositorio) para compañía ID: ${idCompany}`);
      const mapAttr = await getCatalogCompanyAttr(idCompany, fetchCompanyAttr);
      logger.info(`Atributos finales para compañía ${idCompany}: ${JSON.stringify(mapAttr)}`);
  
      if (mapAttr && Object.keys(mapAttr).length > 0) {
        const nemonic = mapAttr['nemonico'];
        logger.info(`NEMONICO detectado: ${nemonic}`);
  
        switch (nemonic) {
          case "CNEL":
            return await this.getCNEL(inMs, mapAttr);
          case "CNT":
            return await this.getCNT(inMs, mapAttr);
          case "MEER":
            return await this.getMEER(inMs, mapAttr);
          case "INTERAGUA":
            return await this.getInteragua(inMs, mapAttr);
          case "ETAPA":
            return await this.getEtapa(inMs, mapAttr);
          case "AMAGUA":
          case "EMAPQ":
            return await this.getRecaudacionAgua(inMs, mapAttr);
          default:
            logger.warn(`No existe configuración para el nemónico: ${nemonic}`);
            outMs.errorCode = Util.errCodeCtr;
            outMs.userMessage = "No existe configuración para servicio";
            outMs.systemMessage = "No existe configuración para servicio";
            break;
        }
      } else {
        logger.warn(`No se encontraron atributos para la compañía ID: ${idCompany}`);
        outMs.errorCode = Util.errCodeCtr;
        outMs.userMessage = "No existe configuración para servicio";
        outMs.systemMessage = "No existe configuración para servicio";
      }
    } catch (error) {
      logger.error(`Error en getBasicService para compañía ID: ${inMs?.company?.idCompany}`, error);
      outMs.errorCode = Util.errCode;
      outMs.userMessage = Util.errMessage;
      outMs.systemMessage = error instanceof Error ? error.message : String(error);
    }
  
    logger.info(`getBasicService finalizado con código: ${outMs.errorCode}`);
    return outMs;
  }
  
  // Método para obtener el valor clave del primer elemento del catálogo
  private getKeyFromCatalog(catalog?: any[]): string {
    let ret = "";
    if (catalog && catalog.length > 0) {
      ret = catalog[0].key;
    }
    return ret;
  }

  // Método para obtener el valor del primer elemento del catálogo
  private getValFromCatalog(catalog?: any[]): string {
    let ret = "";
    if (catalog && catalog.length > 0) {
      ret = catalog[0].value;
    }
    return ret;
  }

  // Método común para procesar respuestas de servicios
  private processServiceResponse(
    outMS: MensajeSalidaConsultarServicioBasico | null, 
    serviceName: string
  ): OutMsgGetBasicService {
    let outSrv: OutMsgGetBasicService = {
      errorCode: Util.errCode,
      userMessage: Util.errMessage,
      systemMessage: Util.errMessage
    };
  
    if (outMS === null) {
      logger.warn(`${serviceName}: La respuesta del servicio es null`);
      return {
        ...outSrv,
        errorCode: "122",
        userMessage: "ERROR AL CONSULTAR EL SERVICIO",
        systemMessage: "ERROR AL CONSULTAR EL SERVICIO"
      };
    }
  
    const errorMap: Record<string, { code: string, userMessage: string, systemMessage: string, logError?: boolean }> = {
      "0": { code: outMS.codigoError || '', userMessage: outMS.codigoError || '', systemMessage: outMS.mensajeSistema || ''},
      "34007": { code: "122", userMessage: outMS.mensajeUsuario || '', systemMessage: Util.okMessage },
      "09":     { code: "122", userMessage: "NO REFLEJA DEUDAS", systemMessage: Util.okMessage, logError: true },
      "18":     { code: "122", userMessage: "NO EXISTE CODIGO SUMINISTRO PARA ESA EMPRESA", systemMessage: Util.okMessage, logError: true },
      "java.lang.Exception": { code: "122", userMessage: Util.okError, systemMessage: Util.okError, logError: true },
      "30":     { code: "122", userMessage: "MENSAJE DE FORMATO INVALIDO", systemMessage: "MENSAJE DE FORMATO INVALIDO", logError: true },
      "70013":  { code: "70013", userMessage: "EMPRESA DESTINO NO DISPONIBLE PARA REALIZAR ESTA TRANSACCION", systemMessage: "EMPRESA DESTINO NO DISPONIBLE PARA REALIZAR ESTA TRANSACCION", logError: true },
      "OK":     { code: "122", userMessage: "ERROR AL CONSULTAR EL SERVICIO", systemMessage: "ERROR AL CONSULTAR EL SERVICIO", logError: true }
    };

    if (outMS.codigoError === "0") {
      return {
        errorCode: outMS.codigoError,
        userMessage: outMS.mensajeUsuario || '',
        systemMessage: outMS.mensajeSistema || '',
        basicService: this.getBasicServiceMetodo(outMS.servicioBasico)
      };
    }
    
    const code = outMS.codigoError || '';
    const mapped = errorMap[code];
    
  
    if (mapped) {
      if (mapped.logError) {
        logger.error(`${serviceName} ${outMS.mensajeUsuario}`);
        logger.error(`${serviceName} ${outMS.mensajeSistema}`);
      }
      return {
        errorCode: mapped.code,
        userMessage: mapped.userMessage,
        systemMessage: mapped.systemMessage,
        basicService: this.getBasicServiceMetodo({} as ServicioBasico)
      };
    }
  
    // Caso por defecto si el código no está en el mapa
    logger.error(`${serviceName} ${outMS.mensajeUsuario}`);
    logger.error(`${serviceName} ${outMS.mensajeSistema}`);
    return {
      errorCode: "122",
      userMessage: "ERROR AL CONSULTAR EL SERVICIO",
      systemMessage: "ERROR AL CONSULTAR EL SERVICIO",
      basicService: this.getBasicServiceMetodo({} as ServicioBasico)
    };
  }
  

  private async setupCommonParameters(//Con Cacche
    tabla: string,
    map: Record<string, string>
  ): Promise<Record<string, string>> {
    const catalogName = tabla;
  
    logger.info(`[setupCommonParameters] Preparando fetchCatalog para tabla: ${catalogName}`);
    
    const fetchCatalog = async (table: string): Promise<Record<string, string>> => {
      try {
        logger.info(`[setupCommonParameters] Ejecutando basicServiceRepository.getCatalog para tabla: ${table}`);
        const catalog = await this.basicServiceRepository.getCatalog(table);
        logger.info(`[setupCommonParameters] Catálogo obtenido para tabla ${table}: ${JSON.stringify(catalog)}`);
        return catalog;
      } catch (error) {
        logger.error(`[setupCommonParameters] Error al obtener catálogo ${table}`, error);
        throw error;
      }
    };
  
    logger.info(`[setupCommonParameters] Llamando a getCatalog (caché o repositorio) para tabla: ${catalogName}`);
    const mapGeneral = await getCatalog(catalogName, fetchCatalog);
    logger.info(`[setupCommonParameters] Resultado final del catálogo ${catalogName}: ${JSON.stringify(mapGeneral)}`);
  
    return { ...map, ...mapGeneral };
  }
  

  // Implementación de los métodos para cada servicio

  private async getCNEL(inMs: InMsgGetBasicService, map: Record<string, string>): Promise<OutMsgGetBasicService> { 
    let outSrv: OutMsgGetBasicService = {
      errorCode: Util.errCode,
      userMessage: Util.errMessage,
      systemMessage: Util.errMessage
    };
    let outMS;
    try {
      const combinedMap = await this.setupCommonParameters("cvgenerales", map);
      logger.info('CombineMap: ',combinedMap);
      // Inicializar el objeto de mensaje de entrada
      let inCnel: MensajeEntradaConsultarCNEL = {
        codigoOperador: '',
        canal: '',
        parametros: {} as Parametros,
        codigoAutorizador: '',
        codigoAdquiriente: combinedMap["codigoAdquiriente"],
        codigoSeguridad: '',
        servicioProveedor: combinedMap["servicioProveedor"],
        tipoTransaccion: combinedMap["tipoTransaccion"]
      };
      
      // Configurar el mensaje de entrada
      inCnel = this.setInMessage(inCnel, combinedMap) as MensajeEntradaConsultarCNEL;
      
      // Configurar los parámetros
      const params: Parametros = this.setParameters(inCnel, combinedMap);
      params.empresa = this.getKeyFromCatalog(inMs.company?.region);
      params.codigoSuministro = inMs.serviceCode;
      params.codigoTerminal = combinedMap["codigoTerminal"];
      params.tipoMoneda = combinedMap["monedaProveedor"];
      params.secuencial = combinedMap["secuencialAdq"];
      
      // Asignar parámetros al mensaje
      inCnel.parametros = params;
      
      // Obtener y configurar el código autorizador
      const regionAttr = await this.basicServiceRepository.getCatalog("cnelregion");
      inCnel.codigoAutorizador = regionAttr[params.empresa];
      
      // Construir el código de seguridad
      const year = new Date().getFullYear().toString();
      inCnel.codigoSeguridad = `${combinedMap["codigoSeguridad1"]}${year.substring(2, 4)}${combinedMap["codigoSeguridad2"]}`;
      
      // Llamar al servicio web
      logger.info("Obtener Consulta CNEL: ",inCnel);
      outMS = await this.cnel.obtenerConsultaCnel(inCnel);
      logger.info("Response Consulta CNEL: ",outMS);
      return this.processServiceResponse(outMS, "CNEL");
    } catch (error) {
      logger.error('Error en getCNEL', (error instanceof Error ? error.message : String(error)));
      outSrv.userMessage = outMS?.mensajeUsuario ?? '';
      outSrv.systemMessage = outMS?.mensajeSistema ?? '';
      return outSrv;
    }
  }

  private async getCNT(inMs: InMsgGetBasicService, map: Record<string, string>): Promise<OutMsgGetBasicService> {
    let outSrv: OutMsgGetBasicService = {
      errorCode: Util.errCode,
      userMessage: Util.errMessage,
      systemMessage: Util.errMessage
    };
    
    try {
      const combinedMap = await this.setupCommonParameters("cvgenerales", map);
      
      // Inicializar el objeto de mensaje de entrada
      let inCnt: MensajeEntradaConsultarCNT = {
        canal: '',
        parametros: {} as Parametros,
        codigoComercio: '',
        codigoProveedor: '',
        tipoServicio: '',
        servicio: '',
        consComision: '',
        criterioConsulta: '',
        codigoTransaccion: '',
      };
      
      // Configurar el mensaje de entrada
      logger.info('[getCNT] Iniciando configuración del mensaje de entrada');
      inCnt = this.setInMessage(inCnt, combinedMap) as MensajeEntradaConsultarCNT;
      logger.info('[getCNT] Mensaje de entrada configurado:', JSON.stringify(inCnt, null, 2));

      // Configurar los parámetros
      logger.info('[getCNT] Configurando parámetros');
      const params: Parametros = this.setParameters(inCnt, combinedMap);
      logger.info('[getCNT] Datos de entrada - Company Type:', inMs.company?.type);
      logger.info('[getCNT] Datos de entrada - Company Area:', inMs.company?.area);
      logger.info('[getCNT] Datos de entrada - Service Code:', inMs.serviceCode);

      params.empresa = this.getKeyFromCatalog(inMs.company?.type);
      logger.info('[getCNT] Empresa obtenida del catálogo:', params.empresa);

      params.codigoSuministro = this.getKeyFromCatalog(inMs.company?.area) + inMs.serviceCode;
      logger.info('[getCNT] Código suministro generado:', params.codigoSuministro);

      // Obtener los catálogos necesarios
      logger.info('[getCNT] Obteniendo catálogos');
      const comAttr = await this.basicServiceRepository.getCatalog("cntcomercio");
      logger.info('[getCNT] Catálogo cntcomercio:', JSON.stringify(comAttr, null, 2));

      const codProvAttr = await this.basicServiceRepository.getCatalog("cntcodprov");
      logger.info('[getCNT] Catálogo cntcodprov:', JSON.stringify(codProvAttr, null, 2));

      const tipoSrvAttr = await this.basicServiceRepository.getCatalog("cnttiposrv");
      logger.info('[getCNT] Catálogo cnttiposrv:', JSON.stringify(tipoSrvAttr, null, 2));

      // Configurar propiedades adicionales
      logger.info('[getCNT] Configurando propiedades adicionales');
      inCnt.codigoComercio = comAttr[params.empresa];
      logger.info('[getCNT] Código comercio asignado:', inCnt.codigoComercio);

      inCnt.codigoProveedor = codProvAttr[params.empresa];
      logger.info('[getCNT] Código proveedor asignado:', inCnt.codigoProveedor);

      inCnt.tipoServicio = tipoSrvAttr[params.empresa];
      logger.info('[getCNT] Tipo servicio asignado:', inCnt.tipoServicio);
      
      if (combinedMap["servicio"]) {
        inCnt.servicio = combinedMap["servicio"];
      }

      if (combinedMap["consComision"]) {
        inCnt.consComision = combinedMap["consComision"];
      }

      if (combinedMap["criterioConsulta"]) {
        inCnt.criterioConsulta = combinedMap["criterioConsulta"];
      }

      if (combinedMap["codigoTransaccion"]) {
        inCnt.codigoTransaccion = combinedMap["codigoTransaccion"];
      }
      
      if (combinedMap["secuencial"]) {
        inCnt.secuencial = combinedMap["secuencial"];
      }
      
      logger.info('[getCNT] Valores del mapa asignados:', {
        servicio: inCnt.servicio,
        consComision: inCnt.consComision,
        criterioConsulta: inCnt.criterioConsulta,
        codigoTransaccion: inCnt.codigoTransaccion,
        secuencial: inCnt.secuencial 
      });

      // Asignar parámetros al mensaje
      inCnt.parametros = params;
      logger.info('[getCNT] Mensaje final configurado:', JSON.stringify(inCnt, null, 2));
  
      // Llamar al servicio web
      logger.info("Obtener Consulta CNT");
      let outMS = await this.cnt.obtenerConsultaCnt(inCnt);
      return this.processServiceResponse(outMS, "CNT");
    } catch (error) {
      logger.error('Error en getCNT', error instanceof Error ? error.message : String(error));
      outSrv.userMessage = Util.errMessage;
      outSrv.systemMessage = error instanceof Error ? error.message : String(error);
      return outSrv;
    }
  }

  private async getMEER(inMs: InMsgGetBasicService, map: Record<string, string>): Promise<OutMsgGetBasicService> {
    let outSrv: OutMsgGetBasicService = {
      errorCode: Util.errCode,
      userMessage: Util.errMessage,
      systemMessage: Util.errMessage
    };
  
    try {
      const combinedMap = await this.setupCommonParameters("cvgenerales", map);
      logger.info('COMBINE MAP resultadp sp: ',combinedMap);
      // Initialize the MensajeEntradaConsultarMEER object with all required properties
      let inMeer: MensajeEntradaConsultarMEER = {
        // MensajeEntrada properties
        canal: "",
        parametros: {} as Parametros,
        informacionCore: {} as CoreRecaudacion
      };
      
      // Configurar el mensaje de entrada con los datos básicos
      inMeer = this.setInMessage(inMeer, combinedMap) as MensajeEntradaConsultarMEER;
      logger.info('Configurar el mensaje de entrada con los datos básicos: ',inMeer);

      const params = this.setParameters(inMeer, combinedMap);
      const info: CoreRecaudacion = this.setInformacion(inMeer);
      params.codigoSuministro = inMs.serviceCode;
      params.empresa = String(inMs.company?.idCompany);
      inMeer.parametros = params;
      inMeer.informacionCore = info;
  
      // Llamar al servicio web
      logger.info("Obtener Consulta MEER:", inMeer);
       let outMS = await this.meer.obtenerConsultaMeer(inMeer);
      if (outMS !== null && outMS.codigoError === "0") {
        outMS = this.setConversionDecimal(outMS);
      }
      return this.processServiceResponse(outMS, "MEER");
    } catch (error) {
      logger.error("Error en getMEER", error instanceof Error ? error.message : String(error));
      outSrv.errorCode = Util.errCode;
      outSrv.userMessage = Util.errMessage;
      outSrv.systemMessage = error instanceof Error ? error.message : String(error);
      return outSrv;
    }
  }

  private async getInteragua(inMs: InMsgGetBasicService, map: Record<string, string>): Promise<OutMsgGetBasicService> {
    let outSrv: OutMsgGetBasicService = {
      errorCode: Util.errCode,
      userMessage: Util.errMessage,
      systemMessage: Util.errMessage,
      basicService: undefined
    };
  
    try {
      const combinedMap = await this.setupCommonParameters("cvgenerales", map);
  
      // Initialize MensajeEntradaConsultarInteragua
      let inInteragua: MensajeEntradaConsultarInteragua = {
        // Base MensajeEntrada properties
        canal: "",
        depuracion: "",
        fecha: new Date().toISOString(),
        oficina: 0,
        transaccion: -1,
        secuencial: Date.now().toString(),
        usuario: "",
        
        // MensajeEntradaConsultarInteragua specific properties
        parametros: {} as Parametros,
        opcion: this.getKeyFromCatalog(inMs.company?.type),
        tipoReferencia: this.getValFromCatalog(inMs.company?.type),
        ubicacion: combinedMap["ubicacion"],
        rubroPerson: combinedMap["rubroPerson"],
        serviPerson: combinedMap["serviPerson"]
      };
      
      // Configure the input message with basic data
      inInteragua = this.setInMessage(inInteragua, combinedMap) as MensajeEntradaConsultarInteragua;
      
      // Configure the specific parameters
      const params = this.setParameters(inInteragua, combinedMap);
      params.codigoSuministro = inMs.serviceCode;
      params.empresa = String(inMs.company?.idCompany);
      inInteragua.parametros = params;
  
      // Llamar al servicio web
      logger.info("Obtener Consulta Interagua");
      let outMS = await this.interagua.obtenerConsultaInteragua(inInteragua);
      return this.processServiceResponse(outMS, "INTERAGUA");
    } catch (error) {
      logger.error("Error en getInteragua", error instanceof Error ? error.message : String(error));
      outSrv.errorCode = Util.errCode;
      outSrv.userMessage = Util.errMessage;
      outSrv.systemMessage = error instanceof Error ? error.message : String(error);
      return outSrv;
    }
  }

  private async getEtapa(inMs: InMsgGetBasicService, map: Record<string, string>): Promise<OutMsgGetBasicService> {
    let outSrv: OutMsgGetBasicService = {
      errorCode: Util.errCode,
      userMessage: Util.errMessage,
      systemMessage: Util.errMessage,
      basicService: undefined
    };
  
    try {
      const combinedMap = await this.setupCommonParameters("cvgenerales", map);
  
      // Inicializar el mensaje de entrada
      let inEtapa: MensajeEntradaConsultarEtapa = {};
  
      // Configuración común
      inEtapa = this.setInMessage(inEtapa, combinedMap) as MensajeEntradaConsultarEtapa;
      let params: Parametros = this.setParameters(inEtapa, combinedMap);
      params.codigoSuministro = inMs.serviceCode;
      params.empresa = String(inMs.company?.idCompany);
      inEtapa.parametros = params;
  
      // Llamar al servicio web
      logger.info("Obtener Consulta Etapa: ", inEtapa);
      let outMS = await this.etapa.obtenerConsultaEtapa(inEtapa);
      return this.processServiceResponse(outMS, "ETAPA");
    } catch (error) {
      logger.error("Error en getEtapa", error);
      outSrv.errorCode = Util.errCode;
      outSrv.userMessage = Util.errMessage;
      outSrv.systemMessage = error instanceof Error ? error.message : String(error);
      return outSrv;
    }
  }

  private async getRecaudacionAgua(inMs: InMsgGetBasicService, map: Record<string, string>): Promise<OutMsgGetBasicService> {
    let outSrv: OutMsgGetBasicService = {
      errorCode: Util.errCode,
      userMessage: Util.errMessage,
      systemMessage: Util.errMessage
    };

    try {
      const mapGeneral = await this.basicServiceRepository.getCatalog("cvgenerales");
      const combinedMap = { ...map, ...mapGeneral };

      let inAmagua: MensajeEntradaConsultarRecaudacionAgua = {
        canal: "",
        parametros: {} as Parametros
      };
      
      // Configurar el mensaje de entrada con los datos básicos
      inAmagua = this.setInMessage(inAmagua, combinedMap) as MensajeEntradaConsultarRecaudacionAgua;
      
      // Establecer canal específico para agua si existe
      if (combinedMap["canalAgua"]) {
        inAmagua.canal = combinedMap["canalAgua"];
      }
      
      // Configurar los parámetros específicos
      const params = this.setParameters(inAmagua, combinedMap);
      params.codigoSuministro = inMs.serviceCode;
      params.empresa = String(inMs.company?.idCompany);
      inAmagua.parametros = params;

      // Llamar al servicio web
      logger.info("Obtener Consulta Agua");
      let outMS = await this.recaudacionAgua.obtenerConsultaAgua(inAmagua);
      return this.processServiceResponse(outMS, "AGUA");
    } catch (error) {
      logger.error('Error en getRecaudacionAgua', error);
      outSrv.errorCode = Util.errCode;
      outSrv.userMessage = Util.errMessage;
      outSrv.systemMessage = error instanceof Error ? error.message : String(error);
      return outSrv;
    }
  }

  public setConversionDecimal(out: MensajeSalidaConsultarServicioBasico): MensajeSalidaConsultarServicioBasico {
    // Check if servicioBasico exists
    if (out.servicioBasico?.deudaTotal !== undefined && out.servicioBasico.deudaTotal !== 0) {
      // Divide by 100 to convert cents to dollars
      const valor: number = out.servicioBasico.deudaTotal / 100;
      out.servicioBasico.deudaTotal = valor;
    }
    
    return out;
  }

  // Método para configurar el mensaje de entrada
  setInMessage(ret: MensajeEntrada, map: Record<string, string>): MensajeEntrada {
    ret.canal = map["canal"] || "";
    ret.depuracion = map["depuracion"] || "";
    ret.oficina = map["oficina"] ? parseInt(map["oficina"], 10) : 0;
    ret.usuario = map["usuario"] || "";
    ret.transaccion = map["transaccion"] ? parseInt(map["transaccion"], 10) : -1;
    
    // Establecer fecha en formato ISO
    const ahora = new Date();
    ret.fecha = ahora.toISOString();
    ret.secuencial = Date.now().toString();
    logger.info('In Message configurado: ',ret);
    return ret;
  }

  // Método para configurar los parámetros
  setParameters(inMs: MensajeEntrada, map: Record<string, string>): Parametros {
    const fecha = inMs.fecha ? new Date(inMs.fecha) : new Date();
    const hora = fecha.getHours().toString().padStart(2, '0') + 
                fecha.getMinutes().toString().padStart(2, '0') + 
                fecha.getSeconds().toString().padStart(2, '0');
    
    return {
      aplicativoCobis: map["aplicativoCobis"] || "",
      autorizacion: map["autorizacion"] || "",
      canalCobranza: map["canalCobranza"],
      codigoTerminal: map["codigoTerminal"] || "",
      hora: hora,
      tipoMoneda: map["tipoMoneda"],
      monedaComision: map["monedaComision"] || "",
      consultaComision: map["consultaComision"] || "",
      canalComision: map["canalComision"] || "",
      fechaTransaccionLocal: inMs.fecha,
      secuencial: inMs.secuencial || "",
      servicioProveedor: map["servicioProveedor"] || ""
    };
  }

  public setInformacion(inMs: MensajeEntrada): CoreRecaudacion {
    const info: CoreRecaudacion = {
        codigoTRX: inMs.transaccion,
        secuencial: inMs.secuencial ? parseInt(inMs.secuencial) || undefined : undefined
    }; 
    return info;
  }

  private getBasicServiceMetodo(srv?: ServicioBasico): BasicService {
    let basicSrv: BasicService | null = null;

    if (srv != null) {
      basicSrv = {};

      if (srv.cliente != null) {
        const cli: Client = {
          name: srv.cliente.nombre,
          // Commented optional fields
          // identification: srv.cliente.identificacion || '',
          // identificationType: srv.cliente.tipoIdentificacion,
          // mail: srv.cliente.correo,
          // phone: srv.cliente.telefono
        };
        basicSrv.client = cli;
      }

      basicSrv.commission = parseFloat(Number(srv.comision).toFixed(2));
      basicSrv.totalDbt = parseFloat(Number(srv.deudaTotal).toFixed(2));
      basicSrv.minAmount = parseFloat(Number(srv.montoMinimo).toFixed(2));
    }

    return basicSrv as BasicService;
  }
}