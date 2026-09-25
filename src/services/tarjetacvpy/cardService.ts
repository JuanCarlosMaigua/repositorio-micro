import { logger } from '../../utils/logger';
import { CardRepository } from '../../repositories/tarjetacvpy/cardRepository';
import { InMsgGetCard } from '../../models/tarjetacvpy/inMsgGetCard';
import { OutMsgGetCard } from '../../models/tarjetacvpy/outMsgGetCard';
import { Client } from '../../models/shared/client';
import { CustomError } from '../../utils/tarjetacvpy/customError';
import { Util } from '../../utils/response'; 

export class CardService {
  private readonly cardRepository: CardRepository;

  constructor() {
    this.cardRepository = new CardRepository();
  }

    async getCards(headers: any, inMsg: InMsgGetCard): Promise<OutMsgGetCard | null> {
    const outMsg: OutMsgGetCard = {
      errorCode: '',
      userMessage: '',
      systemMessage: ''
    };

    try {
      logger.info(`[CardService] Procesando solicitud getCards para cliente: ${inMsg.client?.identification}`);
      
      // Validar entrada
      this.validateVal(inMsg.client, "client");
      this.validateVal(inMsg.client.identification, "identification");

      // Preparar cliente para SOAP
      const cliente: Client = this.getClientForSoap(inMsg.client);
      logger.info('CLIENTE CEDULA Y TIPO IDENTIFICACION (JSON):', cliente);
      logger.info('Tipo de identificación obtenido:', cliente.identificationType);

      const response = await this.cardRepository.consultarTarjetas(cliente, headers);

      logger.info(`[CardService] Procesamiento getCards completado con código: ${response?.errorCode}`);
      return response;
    } catch (error: any) {
      if (error instanceof CustomError) {
        outMsg.errorCode = error.errorCode;
        outMsg.userMessage = error.userMessage;
        outMsg.systemMessage = error.message;
      } else {
        logger.error(`[CardService] Error en getCards: ${error.message}`, error);
        outMsg.errorCode = Util.errCode;
        outMsg.userMessage = Util.errMessage;
        outMsg.systemMessage = error.message || 'Error desconocido';
      }
      return outMsg;
    }
  }

  private validateVal(element: any, value: string): void {
    if (element === null || element === undefined || 
        (typeof element === 'string' && element.trim() === '')) {
      throw new CustomError(Util.errCode, Util.errMessage, `Se requiere ${value}`);
    }
  }

  private getClientForSoap(client: Client): Client {
    const idType = Util.getIdentificationType(client.identification!);
    if (!idType) {
      throw new CustomError(Util.errCode, Util.errMessage, 'No se puede identificar tipo de identificación');
    }
    
    client.identificationType=idType;

    return  client;
  }

}