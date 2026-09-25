import { OutMsgSaveTransaction, Transaction } from '../../models/transaccioncvpy/transaction';
import {  executeStoredProcedure, executeStoredProcedureConfig, executeStoredProcedureDeposit, executeStoredProcedurePay, executeStoredProcedurePyCard } from '../../utils/dbmysql';
import { logger } from '../../utils/logger';
import { Util } from '../../utils/response';

export interface ConfigurationResult {
  s_tiempovida: number;
  s_tiempovida_web: number;
  s_canttransc: number;
  s_infolegal: string;
  s_maxefectivo: string;
}

export class TransactionRepository {
  async getTransactionsByDevice(deviceId: number, maxTransactions: number): Promise<Transaction[]> {
    try {
      // Obtener transacciones tipo depósito
      const depositsResult = await this.getDeposits(deviceId);
      
      // Obtener transacciones tipo tarjeta
      const cardsResult = await this.getPayCards(deviceId);
      
      // Obtener transacciones tipo servicio
      const servicesResult = await this.getPayServices(deviceId);
      
      // Combinar todas las transacciones
      let allTransactions: Transaction[] = [
        ...depositsResult,
        ...cardsResult,
        ...servicesResult
      ];
              // Ordenar por fecha descendente (más recientes primero)
        allTransactions.sort((a, b) => {
          if (!a.createDate || !b.createDate) return 0;

          // Convertir a objeto Date si es string
          const dateA = typeof a.createDate === 'string' ? new Date(a.createDate) : a.createDate;
          const dateB = typeof b.createDate === 'string' ? new Date(b.createDate) : b.createDate;

          return dateB.getTime() - dateA.getTime(); // Más recientes primero
        });

      
      // Limitar al número máximo de transacciones
      allTransactions = allTransactions.slice(0, maxTransactions);
      
      return allTransactions;
    } catch (error) {
      logger.error('Error al obtener transacciones por dispositivo:', error);
      return [];
    }
  }
  
  async getDeposits(deviceId: number): Promise<Transaction[]> {
    try {
      const params = [deviceId];
      
      const result = await executeStoredProcedure<any[]>('pa_cv_gtransactions', params);
      
      if (!Array.isArray(result) || result.length === 0) {
        return [];
      }
      
      // Convertir resultado a formato de Transaction
      const transactions: Transaction[] = [];
      
      // La estructura de resultado puede variar según el procedimiento almacenado
      if (Array.isArray(result[0])) {
        for (const row of result[0]) {
          const transaction: Transaction | null = this.mapDepositToTransaction(row);
          if (transaction) {
            transactions.push(transaction);
          }
        }
      }
      
      return transactions;
    } catch (error) {
      logger.error('Error al obtener depósitos:', error);
      return [];
    }
  }
  
  async getPayCards(deviceId: number): Promise<Transaction[]> {
    try {
      const params = [deviceId];
      
      const result = await executeStoredProcedure<any[]>('pa_cv_ctransactionstc', params);
      
      if (!Array.isArray(result) || result.length === 0) {
        return [];
      }
      
      // Convertir resultado a formato de Transaction
      const transactions: Transaction[] = [];
      
      // La estructura de resultado puede variar según el procedimiento almacenado
      if (Array.isArray(result[0])) {
        for (const row of result[0]) {
          const transaction = this.mapPayCardToTransaction(row);
          if (transaction) {
            transactions.push(transaction);
          }
        }
      }
      
      return transactions;
    } catch (error) {
      logger.error('Error al obtener tarjetas:', error);
      return [];
    }
  }
  
  async getPayServices(deviceId: number): Promise<Transaction[]> {
    try {
      const params = [deviceId];
      
      const result = await executeStoredProcedure<any[]>('pa_cv_ctransactionsps', params);
      
      if (!Array.isArray(result) || result.length === 0) {
        return [];
      }
      
      // Convertir resultado a formato de Transaction
      const transactions: Transaction[] = [];
      
      // La estructura de resultado puede variar según el procedimiento almacenado
      if (Array.isArray(result[0])) {
        for (const row of result[0]) {
          const transaction = this.mapPayServiceToTransaction(row);
          if (transaction) {
            transactions.push(transaction);
          }
        }
      }
      
      return transactions;
    } catch (error) {
      logger.error('Error al obtener servicios:', error);
      return [];
    }
  }
  
   async getConfigurations(): Promise<ConfigurationResult> {
    try {
      logger.info(`Iniciando obtención de configuraciones`);
  
      const resultArray = await executeStoredProcedureConfig<ConfigurationResult[]>('pa_cv_cconfiguration');
  
      logger.info(`RESPONSE SP`, resultArray);
  
      const result = resultArray?.[0];
      return result;
  
    } catch (error) {
      logger.error('Error al obtener configuraciones:', error);
      throw error;
    }
  }

  // Métodos auxiliares para mapear resultados a objetos Transaction
  private formatDateToEcuadorTime(date: Date | string | null | undefined): string | null {
  try {
    // Si la fecha es null o undefined, retornar null
    if (!date) {
      return null;
    }

    // Convertir a Date si es string
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Validar que es una fecha válida
    if (isNaN(dateObj.getTime())) {
      logger.warn('Fecha inválida detectada, retornando null');
      return null;
    }

    const year = dateObj.getFullYear();
    const month = this.pad(dateObj.getMonth() + 1);
    const day = this.pad(dateObj.getDate());
    const hours = this.pad(dateObj.getHours());
    const minutes = this.pad(dateObj.getMinutes());
    const seconds = this.pad(dateObj.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    logger.error('Error al formatear fecha, retornando null:', error);
    return null;
  }
}
  
  private pad(n: number): string {
    return n < 10 ? '0' + n : String(n);
  }

  
  private mapDepositToTransaction(row: any): Transaction | null {
    try {
      return {
        idTransaction: row.TRX_ID || row.TR_ID,
        ctCode: row.CT || row.TC_CT,
        createDate: this.formatDateToEcuadorTime(row.TRX_DATE || row.TR_UPDATED) || undefined,
        typeNemonic: row.TRANSACTION_TYPE || row.TT_NEMONIC,
        typeCode: row.ID_TRANSACTION_TYPE || row.TT_ID,
        maxTime: row.MAX_TIME,
        maxTransaction: row.MAX_TRANSACTIONS,
        accessType: row.ACCES_TYPE,
        check: row.CHECK !== undefined && row.CHECK !== null ? Boolean(row.CHECK) : false,
        depositor: {
          identificationType: 'C',
          identification: row.DEPOSITOR_DNI || row.TR_DEPOSITOR_DNI,
          name: row.DEPOSITOR_NAME || row.TR_DEPOSITOR_NAME,
          phone: row.PHONE_NUMBER,
          mail: row.MAIL
        },
        deposit: {
          accountNumber: row.TR_ACCOUNT_NUMBER,
          accountTypeCode: row.TR_ACCOUNT_TYPE,
          amountCash: parseFloat(row.TR_AMOUNT_CASH) || 0.0,
          amountCheck: parseFloat(row.TR_AMOUNT_CHECK) || 0.0,
          nCheck: row.TR_N_CHEQUE,
          fundsSource: row.TR_FUNDS_SOURCE,
          fundsDestination: row.TR_FUNDS_DESTINATION,
          sign: row.TR_SIGN,
          client: {
            name: row.TR_ACCOUNT_FULLNAME,
            identification: ''
          }
        },
        receipt: {
          codTrans: row.TC_COD_TRANS,
          ipAgency: row.TC_IP_AGENCY,
          officeCode: row.TC_OFFICE_CODE,
          currency: row.TC_CURRENCY,
          officeUser: row.TC_OFFICE_USER,
          sec: row.TC_SEC,
          codTransOnOff: row.TC_TRANSC_CODE,
          description: row.TC_TRANSC_DESCRIPTION,
          officeHour: row.TC_OFFICE_HOURS,
          ruc: row.TC_RUC,
          direction: row.TC_DIRECTION
        },
        poll: {
          pollId: row.IQ_ID
        },
        session: {
          sessionId: row.SS_ID,
          deviceId: row.DV_ID,
          uuId: row.DV_UUID,
          operatingSystem: row.DV_OS,
          ip: row.IP
        }
      };
    } catch (error) {
      logger.error('Error al mapear depósito a transacción:', error);
      return null;
    }
  }
  
  private mapPayCardToTransaction(row: any): Transaction | null {
    try {
      return {
        idTransaction: row.ID,
        ctCode: row.TC_CT,
        createDate: this.formatDateToEcuadorTime(row.TT_UPDATED) || undefined,
        typeNemonic: row.TT_NEMONIC,
        typeCode: row.TT_ID,
        session: {
          deviceId: row.DV_ID,
          sessionId: row.SS_ID,
          uuId: row.DV_UUID || '',
          operatingSystem: row.DV_OS || '',
          ip: row.IP || ''
        },
        depositor: {
          identification: row.TT_DEPOSITOR_DNI,
          name: row.TT_DEPOSITOR_NAME
        },
        payCard: {
          cardNumber: row.TT_CARD_NUMBER,
          cardKey: row.TT_CARD_KEY,
          cardType: row.TT_CARD_TYPE,
          cardBrand: row.TT_CARD_BRAND,
          amountCash: row.TT_AMOUNT_CASH,
          nCheck: row.TT_N_CHECK,
          amountCheckBb: row.TT_AMOUNT_CHECK_BB,
          amountCheckOb: row.TT_AMOUNT_CHECK_OB,
          amountTotalCheckEx: row.TT_AMOUNT_TOTAL_CHECK_EX,
          amountCheckMi: row.TT_AMOUNT_CHECK_MI,
          amountCheckNy: row.TT_AMOUNT_CHECK_NY,
          amountCheckOp: row.TT_AMOUNT_CHECK_OP,
          totalAmount: row.TT_TOTAL_AMOUNT,
          fundsSource: row.TT_FUNDS_SOURCE,
          fundsDestination: row.TT_FUNDS_DESTINATION,
          client: {
            name: row.TT_CARD_NAME,
            identification: row.TT_CARD_DNI
          }
        },
        receipt: {
          codTrans: row.TC_COD_TRANS,
          ipAgency: row.TC_IP_AGENCY,
          officeCode: row.TC_OFFICE_CODE,
          currency: row.TC_CURRENCY,
          officeUser: row.TC_OFFICE_USER,
          sec: row.TC_SEC,
          codTransOnOff: row.TC_TRANSC_CODE,
          description: row.TC_TRANSC_DESCRIPTION,
          officeHour: row.TC_OFFICE_HOURS,
          closingDate: row.TC_CLOSING_DATE
        },
        poll: {
          pollId: row.IQ_ID
        }
      };
    } catch (error) {
      logger.error('Error al mapear tarjeta a transacción:', error);
      return null;
    }
  }
  
  private mapPayServiceToTransaction(row: any): Transaction | null {
    try {
      return {
        idTransaction: row.TS_ID,
        ctCode: row.TC_CT,
        createDate: this.formatDateToEcuadorTime(row.TS_UPDATED) || undefined,
        typeNemonic: row.TT_NEMONIC,
        typeCode: row.TT_ID,
        session: {
          deviceId: row.DV_ID,
          sessionId: row.SS_ID,
          uuId: row.DV_UUID || '',
          operatingSystem: row.DV_OS || '',
          ip: row.IP || ''
        },
        depositor: {
          identification: row.TS_DEPOSITOR_DNI,
          name: row.TS_DEPOSITOR_NAME
        },
        payService: {
          serviceCode: row.TS_SERVICE_CODE,
          company: {
            idCompany: row.CO_ID,
            nameCompany: row.CO_NAME,
            idService: row.SE_ID,
            nameService: row.SE_NAME,
            type: [
              {
                key: row.TS_TYPE_KEY,
                value: row.TS_TYPE_VAL
              }
            ],
            region: [
              {
                key: row.TS_REGION_KEY,
                value: row.TS_REGION_VAL
              }
            ],
            area: [
              {
                key: row.TS_AREA_KEY,
                value: row.TS_AREA_VAL
              }
            ]
          },
          client: {
            name: row.TS_SERVICE_NAME,
            identification: row.TS_SERVICE_DNI
          },
          nCheck: row.TS_N_CHECK,
          commission: parseFloat(row.TS_COMMISSION).toFixed(2),
          amountCash: row.TS_AMOUNT_CASH,
          amountCheck: row.TS_AMOUNT_CHECK,
          totalAmount: row.TS_TOTAL_AMOUNT,
          fundsSource: row.TS_FUNDS_SOURCE,
          fundsDestination: row.TS_FUNDS_DESTINATION,
          bill: row.TS_BILL,
          minAmount: parseFloat(row.TS_MIN_AMOUNT).toFixed(2),
          totalDbt: parseFloat(row.TS_TOTAL_DBT).toFixed(2)
        },
        receipt: {
          codTrans: row.TC_COD_TRANS,
          ipAgency: row.TC_IP_AGENCY,
          officeCode: row.TC_OFFICE_CODE,
          currency: row.TC_CURRENCY,
          officeUser: row.TC_OFFICE_USER,
          sec: row.TC_SEC,
          codTransOnOff: row.TC_TRANSC_CODE,
          description: row.TC_TRANSC_DESCRIPTION,
          officeHour: row.TC_OFFICE_HOURS,
          closingDate: row.TC_CLOSING_DATE,
          accesKey: row.TC_ACCES_KEY
        },
        poll: {
          pollId: row.IQ_ID
        }
      };
    } catch (error) {
      logger.error('Error al mapear servicio a transacción:', error);
      return null;
    }
  }
  
   buildEmptyResponse(): OutMsgSaveTransaction {
    return { errorCode: '', systemMessage: '', userMessage: '' };
  }
  
   buildSuccessResponse(transaction: Transaction): OutMsgSaveTransaction {
    return {
      transaction,
      errorCode: Util.okCode,
      systemMessage: Util.okMessage,
      userMessage: Util.okMessage
    };
  }
  
   buildErrorResponse(errorMsg?: string): OutMsgSaveTransaction {
    return {
      errorCode: Util.errCode,
      userMessage: Util.errMessage,
      systemMessage: errorMsg || Util.errMessage
    };
  }

  async  registerDeposit(transaction: Transaction): Promise<OutMsgSaveTransaction> {
    try {
      logger.info('TRANSACCION REQUEST: ', transaction);
      const params = this.buildDepositParams(transaction);
      const result = await executeStoredProcedureDeposit<any[]>('pa_cv_itransaction', params);
  
      if (Array.isArray(result) && result.length > 0) {
        this.updateTransactionFromDepositResult(transaction, result[0][0]);
        return this.buildSuccessResponse(transaction);
      }
      return this.buildErrorResponse();
    } catch (error) {
      logger.error(Util.errMessage, error);
      return this.buildErrorResponse();
    }
  }
  
   buildDepositParams(t: Transaction): any[] {
    return [
      t.session?.deviceId,
      t.session?.sessionId,
      t.deposit?.accountNumber,
      t.deposit?.client?.name || '',
      t.deposit?.accountTypeCode,
      t.deposit?.amountCash || 0,
      t.deposit?.amountCheck || 0,
      t.deposit?.nCheck || 0,
      t.depositor?.identification,
      t.depositor?.name,
      t.deposit?.fundsSource || '',
      t.deposit?.fundsDestination || '',
      t.depositor?.phone || '',
      t.depositor?.mail || '',
      t.deposit?.sign || '',
      t.typeNemonic,
      t.accessType,
      null, null
    ];
  }
  
   updateTransactionFromDepositResult(t: Transaction, r: any): void {
    t.idTransaction = r.TR_ID;
    t.typeCode = r.ID_TRANSACTION_TYPE;
    t.ctCode = r.CT;
    t.maxTime = r.MAX_TIME;
    t.maxTransaction = r.MAX_TRANSACTIONS;
    t.createDate = this.formatDateToEcuadorTime(r.TR_UPDATED) || undefined;
    t.session = {
      ...t.session!,
      uuId: r.DV_UUID,
      operatingSystem: r.DV_OS,
      ip: r.IP
    };
  }
  
  async  registerPayCard(transaction: Transaction): Promise<OutMsgSaveTransaction> {
    try {
      if (!transaction.session || !transaction.payCard || !transaction.depositor) return this.buildEmptyResponse();
  
      const params = this.buildPayCardParams(transaction);
      const result = await executeStoredProcedurePyCard<any[]>('pa_cv_itransaction_tc', params);
      const row = result[0];
  
      if (row.s_error_code === 0) {
        this.updateTransactionFromPayCardResult(transaction, row);
        return this.buildSuccessResponse(transaction);
      }
      return this.buildErrorResponse(row.s_error_msg);
    } catch (error) {
      logger.error('Error al registrar tarjeta:', error);
      return this.buildErrorResponse();
    }
  }
  
   buildPayCardParams(t: Transaction): any[] {
    return [
      t.session?.sessionId || '',
      t.payCard?.client?.identification,
      t.payCard?.cardNumber,
      t.payCard?.cardKey,
      t.payCard?.client?.name,
      t.payCard?.cardType,
      t.payCard?.cardBrand,
      t.payCard?.amountCash || 0,
      t.payCard?.nCheck || 0,
      t.payCard?.amountCheckBb || 0,
      t.payCard?.amountCheckOb || 0,
      t.payCard?.amountTotalCheckEx || 0,
      t.payCard?.amountCheckMi || 0,
      t.payCard?.amountCheckNy || 0,
      t.payCard?.amountCheckOp || 0,
      t.payCard?.totalAmount || 0,
      t.depositor?.identification,
      t.depositor?.identificationType || '',
      t.depositor?.name,
      t.depositor?.phone || '',
      t.depositor?.mail || '',
      t.payCard?.fundsSource || '',
      t.payCard?.fundsDestination || '',
      t.typeNemonic,
      t.accessType,
      null, null, null, null, null, null, null, null, null, null
    ];
  }
  
   updateTransactionFromPayCardResult(t: Transaction, r: any): void {
    t.ctCode = r.s_ct;
    t.createDate = this.formatDateToEcuadorTime(r.s_date_create) || undefined;
    t.idTransaction = r.s_tt_id;
    t.typeCode = r.s_id_transaction_type;
    t.maxTime = r.s_life_time;
    t.session!.ip = r.s_ip;
    t.session!.uuId = r.s_uuid;
    t.session!.operatingSystem = r.s_os;
  }

  async  registerPayService(transaction: Transaction): Promise<OutMsgSaveTransaction> {
    try {
      if (!transaction.session || !transaction.payService || !transaction.depositor) return this.buildEmptyResponse();
  
      const params = this.buildPayServiceParams(transaction);
      const result = await executeStoredProcedurePay<any[]>('pa_cv_itransaction_ps', params);
      const row = result[0];
  
      if (row.s_error_code === 0) {
        this.updateTransactionFromPayServiceResult(transaction, row);
        return this.buildSuccessResponse(transaction);
      }
      return this.buildErrorResponse(row.s_error_msg);
    } catch (error) {
      logger.error(Util.errMessage, error);
      return this.buildErrorResponse();
    }
  }
  
   buildPayServiceParams(t: Transaction): any[] {
    if (!t.session || !t.payService || !t.depositor) {
      return [];
    }
    const c = t.payService.company;
    const getKeyVal = (arr?: any[]) => (arr?.length ? [arr[0].key, arr[0].value] : [null, null]);
    const [typeKey, typeVal] = getKeyVal(c?.type);
    const [regionKey, regionVal] = getKeyVal(c?.region);
    const [areaKey, areaVal] = getKeyVal(c?.area);
  
    return [
      // 28 parámetros de entrada:
      t.session.sessionId,                     // 1
      c?.idCompany,                            // 2
      t.payService.client?.identification,     // 3
      t.payService.serviceCode,                // 4
      t.payService.client?.name,               // 5
      typeKey, typeVal,                        // 6-7
      regionKey, regionVal,                    // 8-9
      areaKey, areaVal,                        // 10-11
      t.payService.nCheck,                     // 12
      t.payService.bill,                       // 13
      t.payService.commission,                 // 14
      t.payService.amountCash,                 // 15
      t.payService.amountCheck,                // 16
      t.payService.totalAmount,                // 17
      t.payService.minAmount,                  // 18
      t.payService.totalDbt,                   // 19
      t.depositor.identification,              // 20
      t.depositor.identificationType,          // 21
      t.depositor.name,                        // 22
      t.depositor.phone,                       // 23
      t.depositor.mail,                        // 24
      t.payService.fundsSource,                // 25
      t.payService.fundsDestination,           // 26
      t.typeNemonic,                           // 27
      t.accessType,                            // 28 
      // 11 INOUT/OUT params reemplazados por null (se usan en sesión con SET @var)
      null, null, null, null, null,
      null, null, null, null, null, null
    ];
    
  }
  
   updateTransactionFromPayServiceResult(t: Transaction, r: any): void {
    t.ctCode = r.s_ct;
    t.payService!.company!.idService = r.s_se_id;
    t.createDate = this.formatDateToEcuadorTime(r.s_date_create) || undefined;
    t.idTransaction = r.s_ts_id;
    t.typeCode = r.s_id_transaction_type;
    t.maxTime = r.s_life_time;
    t.session!.ip = r.s_ip;
    t.session!.uuId = r.s_uuid;
    t.session!.operatingSystem = r.s_os;
  }
  
  
  

  private verificarArray(result:any,ctCode:any,nombreMetodo:string){
    if (!Array.isArray(result) || result.length === 0) {
      logger.warn(`${nombreMetodo} - No se encontraron resultados para ctCode: ${ctCode}`);
      return null;
    }
    
    logger.info(`${nombreMetodo} - Resultado recibido, longitud: ${result.length}`);
    
    // Obtener el primer conjunto de resultados
    const resultSet = Array.isArray(result[0]) ? result[0] : [result[0]];
    logger.info(`${nombreMetodo} - ResultSet procesado, longitud: ${resultSet.length}`);
    
    if (resultSet.length === 0) {
      logger.warn(`${nombreMetodo} - ResultSet vacío para ctCode: ${ctCode}`);
      return null;
    }
    
    logger.info(`${nombreMetodo} - Datos del primer registro:`, resultSet[0]);
    return resultSet;
  }

  async getTransactionDep(ctCode: string): Promise<Transaction | null> {
    try {
      const params = [ctCode];
      logger.info('REQUEST:', params);
      const result = await executeStoredProcedure<any[]>('pa_cv_ctransaction_dep', params);
      logger.info('RESPONSE:', result);
      
      logger.info(`getTransactionDep - Iniciando búsqueda para ctCode: ${ctCode}`);
      
      // Verificar si hay resultados
      const resultSet=this.verificarArray(result,ctCode,"getTransactionDep");
      if (!resultSet) {
        return null; // o el valor que corresponda cuando no hay datos
      }      
      // Mapear el resultado a un objeto Transaction
      const mappedTransaction = this.mapDepositToTransaction(resultSet[0]);
      logger.info(`getTransactionDep - Transacción mapeada exitosamente para ctCode: ${ctCode}`);
      logger.debug(`getTransactionDep - Transacción mapeada:`, mappedTransaction);
      
      return mappedTransaction;
    } catch (error) {
      logger.error(`getTransactionDep - Error al obtener transacción de depósito para ctCode: ${ctCode}`, error);
      return null;
    }
  }
  
  async getTransactionPayCard(ctCode: string): Promise<Transaction | null> {
    try {
      const params = [ctCode];
      logger.info(`getTransactionPayCard - Iniciando búsqueda para ctCode: ${ctCode}`);
      logger.debug(`getTransactionPayCard - Parámetros enviados:`, params);
      
      const result = await executeStoredProcedure<any[]>('pa_cv_ctransaction_tc', params);
      logger.info(`getTransactionPayCard - Procedimiento almacenado ejecutado para ctCode: ${ctCode}`);
      logger.debug(`getTransactionPayCard - Respuesta cruda del SP:`, result);
      
      // Verificar si hay resultados
      const resultSet=this.verificarArray(result,ctCode,"getTransactionPayCard");
      if (!resultSet) {
        return null; // o el valor que corresponda cuando no hay datos
      }   
      
      // Mapear el resultado a un objeto Transaction
      const mappedTransaction = this.mapPayCardToTransaction(resultSet[0]);
      logger.info(`getTransactionPayCard - Transacción mapeada exitosamente para ctCode: ${ctCode}`);
      logger.debug(`getTransactionPayCard - Transacción mapeada:`, mappedTransaction);
      
      return mappedTransaction;
    } catch (error) {
      logger.error(`getTransactionPayCard - Error al obtener transacción de tarjeta para ctCode: ${ctCode}`, error);
      return null;
    }
  }
  
  async getTransactionPayService(ctCode: string): Promise<Transaction | null> {
    try {
      const params = [ctCode];
      logger.info(`getTransactionPayService - Iniciando búsqueda para ctCode: ${ctCode}`);
      logger.debug(`getTransactionPayService - Parámetros enviados:`, params);
      
      const result = await executeStoredProcedure<any[]>('pa_cv_ctransaction_ps', params);
      logger.info(`getTransactionPayService - Procedimiento almacenado ejecutado para ctCode: ${ctCode}`);
      logger.debug(`getTransactionPayService - Respuesta cruda del SP:`, result);
      
      // Verificar si hay resultados
      const resultSet=this.verificarArray(result,ctCode,"getTransactionPayService");
      if (!resultSet) {
        return null; // o el valor que corresponda cuando no hay datos
      }      
      
      // Mapear el resultado a un objeto Transaction
      const mappedTransaction = this.mapPayServiceToTransaction(resultSet[0]);
      logger.info(`getTransactionPayService - Transacción mapeada exitosamente para ctCode: ${ctCode}`);
      logger.debug(`getTransactionPayService - Transacción mapeada:`, mappedTransaction);
      
      return mappedTransaction;
    } catch (error) {
      logger.error(`getTransactionPayService - Error al obtener transacción de servicio para ctCode: ${ctCode}`, error);
      return null;
    }
  }

  
}