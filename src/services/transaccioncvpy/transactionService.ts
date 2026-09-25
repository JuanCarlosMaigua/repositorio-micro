import { MensajeEntrada } from '../../models/recaudacioncvpy/ClienteModel/MensajeEntradaConsultarRecaudacionAgua';
import { TipoIdentificacionPersona } from '../../models/recaudacioncvpy/ClienteModel/MensajeSalidaConsultarServicioBasico';
import { Catalog } from '../../models/transaccioncvpy/catalog';
import { Company } from '../../models/transaccioncvpy/company';
import { Catalogo, CatalogoDetalle, Cliente, Cuenta, Dispositivo, Empresa, MensajeEntradaGuardarTransaccion, MensajeSalidaGuardarTransaccion, Servicio,Tarjeta, Transaccion } from '../../models/transaccioncvpy/paycard';
import { InMsgListTransactions, OutMsgListTransactions, InMsgGetTransaction, OutMsgGetTransaction, InMsgSaveTransaction, OutMsgSaveTransaction, Transaction } from '../../models/transaccioncvpy/transaction';
import { TransactionRepository } from '../../repositories/transaccioncvpy/transactionRepository';
import { logger } from '../../utils/logger';
import { Util } from '../../utils/response';
import { TransaccionCvMs } from './client/transaccionCvMs';

export class TransactionService {
  private readonly transactionRepository: TransactionRepository;
  private readonly clienteTransaccionCvMs: TransaccionCvMs;


  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.clienteTransaccionCvMs = new TransaccionCvMs();
  }
  
  async listTransactions(inMsg: InMsgListTransactions): Promise<OutMsgListTransactions> {
    const outMsg: OutMsgListTransactions = {
      errorCode: Util.errCode,
      userMessage: Util.errMessage,
      systemMessage: Util.errMessage
    };
    
    try {
      // Obtener las configuraciones para determinar el número máximo de transacciones
      const config = await this.transactionRepository.getConfigurations();
      logger.info("Obteniendo las configuraciones: ",config);
      const maxTransactions = config?.s_canttransc || 5; // Valor por defecto
      
      // Obtener las transacciones para el dispositivo
      const transactions = await this.transactionRepository.getTransactionsByDevice(inMsg.device.deviceId, maxTransactions);
      
      if (transactions) {
        outMsg.transactions = transactions;
        outMsg.errorCode = Util.okCode;
        outMsg.userMessage = Util.okMessage;
        outMsg.systemMessage = Util.okMessage;
      } else {
        outMsg.errorCode = Util.errCodeCtr;
        outMsg.userMessage = 'No se encontraron transacciones';
        outMsg.systemMessage = 'No se encontraron transacciones';
      }
    } catch (error) {
      logger.error('Error al listar transacciones:', error);
      outMsg.errorCode = Util.errCode;
      outMsg.userMessage = 'OCURRIÓ UN ERROR AL CONSULTAR EL SERVICIO';
      outMsg.systemMessage = 'OCURRIÓ UN ERROR AL CONSULTAR EL SERVICIO';
    }
    
    return outMsg;
  }

  async saveTransaction(inMsg: InMsgSaveTransaction, headers: Record<string, string | undefined>): Promise<OutMsgSaveTransaction> {
    let outMs: OutMsgSaveTransaction = {
      errorCode: '',
      userMessage: '',
      systemMessage: ''
    };
    
    try {
      // Determinar el tipo de transacción y llamar al método correspondiente
      const typeNemonic = inMsg.transaction.typeNemonic;
      logger.info('TIPO DE NEMONICO: '+typeNemonic);
      logger.info(`REQUEST:`,inMsg);

      switch (typeNemonic) {
        case 'DP': // Depósito
          outMs = await this.transactionRepository.registerDeposit(inMsg.transaction);
          break;
        case 'TC': // Tarjeta
          outMs = await this.transactionRepository.registerPayCard(inMsg.transaction);
          break;
        case 'PS': // Servicio
          outMs = await this.transactionRepository.registerPayService(inMsg.transaction);
          break;
        default:
          outMs.errorCode = Util.errCodeCtr;
          outMs.userMessage = Util.errMessage;
          outMs.systemMessage = 'No existe configuración para el tipo ingresado';
          return outMs;
      }
      
      try {
        if (outMs.errorCode === "0") {
          await this.sendTransactionToOP(headers, outMs);
        }
      } catch (error) {
        logger.error("Error al comunicarse con TransaccionCvMS", error);
      }
    } catch (error) {
      logger.error('Error al guardar transacción:', error);
      outMs.errorCode = Util.errCode;
      outMs.userMessage = 'OCURRIÓ UN ERROR AL CONSULTAR EL SERVICIO';
      outMs.systemMessage = error instanceof Error ? error.message : 'Error desconocido';
    }
    
    return outMs;
  }

  private async sendTransactionToOP(header: any, outMs: OutMsgSaveTransaction): Promise<void> {
    try {
      // Obtener el cliente para la transacción
   // const clientTransaction: TransaccionCvPortType = this.clientTransactionCVMS();
    
    // Preparar los datos de la transacción
    let inTransaction: MensajeEntradaGuardarTransaccion = await this.setMsgSaveTransaction(outMs.transaction!);
    
    // Configurar el mensaje de entrada
    inTransaction = await this.setMsgIn(header, inTransaction) as MensajeEntradaGuardarTransaccion;
    logger.info("in transaction: ",inTransaction);
    const outTransaction : MensajeSalidaGuardarTransaccion | null = await this.clienteTransaccionCvMs.guardarTransaccion(/*header,*/inTransaction);
    logger.info('Out Transaction: ',outTransaction);
    //outTransaction
      if (outTransaction != null && outTransaction.codigoError == "0") {
        logger.info("Información enviada a TransaccionCvMS");
      } else {
        logger.error(`Error al guardar en TransaccionCvMS ${outTransaction?.mensajeUsuario}, ${outTransaction?.mensajeSistema}`);
      }
    } catch (e) {
      logger.error("Error al conectarse con TrasaccionCvMS", e);
    }
  }

  async setMsgIn(headers: any, mensajeEntrada: MensajeEntrada): Promise<MensajeEntrada>  {
    const canal = headers.canal ?? 'VEN';
    const secuencial = headers.secuencial ?? Date.now().toString();
  
    mensajeEntrada.canal = canal;
    mensajeEntrada.secuencial = secuencial;
  
    try {
      mensajeEntrada.fecha = new Date().toISOString(); // Fecha en formato ISO
    } catch (error) {
      console.error(error);
    }
  
    return  mensajeEntrada;
  }

  async getTransaction(inMsg: InMsgGetTransaction): Promise<OutMsgGetTransaction> {
    const outMsg: OutMsgGetTransaction = {
      errorCode: Util.errCode,
      userMessage: Util.errMessage,
      systemMessage: Util.errMessage
    };
    
    try {
      if (!inMsg.ctCode) {
        outMsg.errorCode = Util.errCodeCtr;
        outMsg.userMessage = 'Código de transacción no especificado';
        outMsg.systemMessage = 'El código de transacción es obligatorio';
        return outMsg;
      }
      
      // Intentar obtener la transacción como depósito
      logger.info("INGRESABDI TRANSACCION DEPOSITO: ",inMsg);
      let transaction = await this.transactionRepository.getTransactionDep(inMsg.ctCode);
      logger.info("TRANSACCION DEPOSITO: ",transaction);
      // Si no es un depósito, intentar como tarjeta
      if (!transaction) {
        logger.info("TRANSACCION getTransactionPayCard: ",transaction);
        transaction = await this.transactionRepository.getTransactionPayCard(inMsg.ctCode);
        logger.info("TRANSACCION getTransactionPayCard: ",transaction);
      }
      
      // Si no es una tarjeta, intentar como servicio
      if (!transaction) {
        logger.info("TRANSACCION getTransactionPayService: ",transaction);
        transaction = await this.transactionRepository.getTransactionPayService(inMsg.ctCode);
        logger.info("TRANSACCION getTransactionPayService: ",transaction);
      }
      
      if (transaction) {
        outMsg.transaction = transaction;
        outMsg.errorCode = Util.okCode;
        outMsg.userMessage = Util.okMessage;
        outMsg.systemMessage = Util.okMessage;
      } else {
        outMsg.errorCode = Util.errCodeCtr;
        outMsg.userMessage = 'No existe transacción';
        outMsg.systemMessage = 'No se encontró la transacción con el código especificado';
      }
    } catch (error) {
      logger.error('Error al consultar transacción:', error);
      outMsg.errorCode = Util.errCode;
      outMsg.userMessage = 'OCURRIÓ UN ERROR AL CONSULTAR EL SERVICIO';
      outMsg.systemMessage = error instanceof Error ? error.message : 'Error desconocido';
    }
    
    return outMsg;
  }


  async setMsgSaveTransaction(trx: Transaction): Promise<MensajeEntradaGuardarTransaccion> {
    logger.info(`[setMsgSaveTransaction] Iniciando procesamiento de transacción. ID: ${trx.idTransaction}, Tipo: ${trx.typeNemonic}`);
    const retorno: MensajeEntradaGuardarTransaccion = {
      canal:'',
      transaccionCliente: {} as Transaccion
    };
  
    const session = trx.session;
    const depositor = trx.depositor;
  
    const trn: Transaccion = {
      idTransaccion: 0,
      codigoCT: ''
    };
    
    logger.info(`[setMsgSaveTransaction] Configurando información del depositante. ID: ${depositor?.identification}`);
    const depositorClient: Cliente = {
      identificacion : depositor?.identification,
      tipoIdentificacion : this.getIdentificationType(depositor?.identification!) as TipoIdentificacionPersona,
      nombre : depositor?.name || '',
      correo : depositor?.mail,
      telefono : depositor?.phone,
    };
    trn.depositante=depositorClient;
  
    logger.info(`[setMsgSaveTransaction] Configurando información del dispositivo. UUID: ${session?.uuId}, IP: ${session?.ip}`);
    const disp: Dispositivo = {};
    disp.identificador = session?.uuId;
    disp.ip = session?.ip;
    trn.dispositivo = disp;
  
    trn.codigoCT = trx.ctCode || '';
    trn.idTransaccion = trx.idTransaction || 0;
  
    trn.tiempoMaximo = trx.maxTime;
    trn.tipoAcceso = trx.accessType;
    trn.tipoTransaccion = trx.typeNemonic;
    trn.idTipoTransaccion = trx.typeCode;
  
    trn.fechaCreacion = this.dateToXMLGregorianCalendar(trx.createDate!);
    retorno.transaccionCliente = trn;
    
    const cli: Cliente = {};
    
    if ("DP" === trx.typeNemonic) {
      logger.info(`[setMsgSaveTransaction] Procesando transacción de DEPÓSITO`);
      const depo = trx.deposit;
      const account: Cuenta = {
        cantidadCheque: null
      };
      
      account.numeroCuenta = depo?.accountNumber;
      account.cantidadCheque = depo?.nCheck;
      account.montoCheque = depo?.amountCheck;
      account.montoEfectivo = depo?.amountCash;
      account.fondoOrigen = depo?.fundsSource;
      account.fondoDestino = depo?.fundsDestination;
      account.tipoCuenta = String(depo?.accountTypeCode);
      cli.nombre = depo?.client?.name || '';
      account.cliente = cli;
      trn.cuenta = account;
      logger.info(`[setMsgSaveTransaction] Configurado depósito. Cuenta: ${depo?.accountNumber}, Monto Efectivo: ${depo?.amountCash}, Monto Cheque: ${depo?.amountCheck}`);
    } else if ("TC" === trx.typeNemonic) {
      logger.info(`[setMsgSaveTransaction] Procesando transacción de TARJETA DE CRÉDITO`);
      const payCard = trx.payCard;
      const card: Tarjeta = {
        cantidadCheque: null
      };
      
      card.cantidadCheque = payCard?.nCheck || 0;
      cli.identificacion = payCard?.client?.identification;
      cli.nombre = payCard?.client?.name || '';
      card.cliente = cli;
      card.codigoUnico = payCard?.cardKey;
      card.marca = payCard?.cardBrand;
      card.fondoOrigen = payCard?.fundsSource;
      card.fondoDestino = payCard?.fundsDestination;
      card.montoChequeBb = payCard?.amountCheckBb;
      card.montoChequeMi = payCard?.amountCheckMi;
      card.montoChequeNy = payCard?.amountCheckNy;
      card.montoChequeOb = payCard?.amountCheckOb;
      card.montoChequeOp = payCard?.amountCheckOp;
      card.montoEfectivo = payCard?.amountCash;
      card.montoTotal = payCard?.totalAmount;
      card.numeroTarjeta = payCard?.cardNumber;
      card.tipo = payCard?.cardType;
      card.totalChequesExterior = payCard?.amountTotalCheckEx;
      trn.tarjeta = card;
      logger.info(`[setMsgSaveTransaction] Configurado pago de tarjeta. Número: ${payCard?.cardNumber}, Monto Total: ${payCard?.totalAmount}, Monto Efectivo: ${payCard?.amountCash}`);
    } else if ("PS" === trx.typeNemonic) {
      logger.info(`[setMsgSaveTransaction] Procesando transacción de PAGO DE SERVICIO`);
      const payService = trx.payService;
      const srv: Servicio = {
        cantidadCheque: null,
        factura: null
      };
  
      cli.identificacion = payService?.client?.identification;
      cli.nombre = payService?.client?.name || '';
      srv.cliente = cli;
      srv.empresa = this.getCompany(payService?.company!);
      srv.codigoServicio = payService?.serviceCode;
      srv.cantidadCheque = payService?.nCheck || 0;
      srv.factura = payService?.bill!;
      srv.comision = payService?.commission;
      srv.montoEfectivo = payService?.amountCash;
      srv.montoCheque = payService?.amountCheck;
      srv.montoMinimo = payService?.minAmount;
      srv.montoTotal = payService?.totalAmount;
      srv.deutaTotal = payService?.totalDbt;
      srv.fondoOrigen = payService?.fundsSource;
      srv.fondoDestino = payService?.fundsDestination;
  
      trn.servicio = srv;
      logger.info(`[setMsgSaveTransaction] Configurado pago de servicio. Código: ${payService?.serviceCode}, Empresa: ${payService?.company?.nameCompany}, Monto Total: ${payService?.totalAmount}`);
    } else {
      logger.info(`[setMsgSaveTransaction] Tipo de transacción no reconocido: ${trx.typeNemonic}`);
    }
  
    logger.info(`[setMsgSaveTransaction] Procesamiento de transacción completado. ID: ${trx.idTransaction}`);
    return retorno;
  }

  
// Función para convertir una fecha a un formato ISO sin zona horaria
private dateToXMLGregorianCalendar(d: any): string {
  if (!d) return '';
  
  try {
      // Ensure d is a Date object
      const date = d instanceof Date ? d : new Date(d);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        logger.error("Invalid date provided:", d);
        return '';
      }
      
      // Formato ISO 8601 sin zona horaria
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  } catch (e) {
      logger.error("Error en conversión de Fecha a formato XML: ", e);
      return '';
  }
}

  private getIdentificationType(identification: string | null): TipoIdentificacionPersona | null {
    if (identification != null) {
        const cant = identification.length;
        const num = /^\d+$/.test(identification); // Verifica si solo contiene dígitos
        
        if (cant === 10 && num)
            return TipoIdentificacionPersona.C;
        else if (cant === 13 && num) {
            return TipoIdentificacionPersona.R;
        } else if (cant > 2) {
            return TipoIdentificacionPersona.P;
        }
    }
    return null;
}

private getCompany(company: Company): Empresa {
 
  // Crear el objeto Empresa usando un objeto literal
  const ret: Empresa = {
    idEmpresa: company.idCompany || 0,
    idServicio: company.idService || 0,
    nombreEmpresa: company.nameCompany ||  '',
    nombreServicio: company.nameService || '',
    tipo: [],
    region: [],
    area: []
  };
  
  if (company.type != null && company.type.length > 0) {
      ret.tipo = ret.tipo || [];
      ret.tipo.push(this.getCatalog(company.type[0]));
  }
  
  if (company.region != null && company.region.length > 0) {
      ret.region = ret.region || [];
      ret.region.push(this.getCatalog(company.region[0]));
  }
  
  if (company.area != null && company.area.length > 0) {
      ret.area = ret.area || [];
      ret.area.push(this.getCatalog(company.area[0]));
  }
  
  return ret;
}

private getCatalog(catalog: Catalog | null): Catalogo {
  // Crear un objeto Catalogo usando un objeto literal
  const ret: Catalogo = {
    nemonico: '',
    catalogo: []
  };
  
  if (catalog != null) {
    const catDet: CatalogoDetalle = {
      clave: catalog.key,
      valor: catalog.value
    };
    
    ret.catalogo.push(catDet);
  }
  
  return ret;
}


}