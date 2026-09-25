import { logger } from '../../utils/logger';
import { ComprobanteRepository } from '../../repositories/comprobantecvpy/comprobanteRepository';
import { MensajeComprobante } from '../../models/comprobantecvpy/mensajeComprobante';
import { CompBasicResponse } from '../../models/comprobantecvpy/compCasicResponse';
import { MensajeEntradaConsultarFirma } from '../../models/comprobantecvpy/mensajeEntradaConsultarFirma';
import { MensajeSalidaConsultarFirma } from '../../models/comprobantecvpy/mensajeSalidaConsultarFirma';

export class ComprobanteService {
  private readonly comprobanteRepository: ComprobanteRepository;

  constructor() {
    this.comprobanteRepository = new ComprobanteRepository();
  }

  async consultarFirma(msjEntrada: MensajeEntradaConsultarFirma): Promise<MensajeSalidaConsultarFirma> {
    const msjSalida: MensajeSalidaConsultarFirma = {
      message: 'OK',
      code: 0
    };

    try {
      this.validaParametro(msjEntrada, 'ct');
      
      const out = await this.comprobanteRepository.consultarFirma(msjEntrada.ct);
      
      if (out.s_error_code === 0) {
        msjSalida.sign = out.s_sign;
      } else {
        msjSalida.code = 999;
        msjSalida.message = 'Firma no existe';
      }

    } catch (error: any) {
      logger.error('Error consultando firma:', error);
      msjSalida.code = error.errorCode || -1;
      msjSalida.message = error.message || 'Error al obtener firma';
    }
    return msjSalida;
  }

  async guardarComprobante(inMs: MensajeComprobante): Promise<CompBasicResponse> {
    const outMs: CompBasicResponse = {
      message: 'OK',
      code: 0
    };
    logger.info('Request Generar Comprobante', inMs);

    try {  
      let out: any = null;
      if (inMs.deposit) {
        out = await this.comprobanteRepository.registrar(inMs);
      } else if (inMs.payCard) {
        out = await this.comprobanteRepository.registrarTc(inMs);
      } else if (inMs.payService) {
        out = await this.comprobanteRepository.registrarPs(inMs);
      } else {
        outMs.code = -1;
        outMs.message = 'No existe una transaccion especificada';
        return outMs;
      }

      if (out) {
        const status = out.s_status;
        if (status === -1) {
          outMs.code = -1;
          outMs.message = out.s_error_msg || 'Error desconocido';
        } else if (status === 0) {
          outMs.code = -1;
          outMs.message = 'Error no existe el id de la transacción';
        } else {
          outMs.code = 0;
          outMs.message = 'Transaccion Ok';
        }
      } else {
        outMs.code = -1;
        outMs.message = 'Error al guardar Comprobante';
      }

      if (outMs.code !== 0) {
        logger.error(outMs.message);
      }

    } catch (error: any) {
      logger.error('Error al guardar Comprobante:', error);
      outMs.code = -1;
      outMs.message = 'Error al guardar Comprobante';
    }

    return outMs;
  }

  private validaParametro(object: any, campo: string): void {
    if (object?.[campo] === undefined || 
        object?.[campo] === null || 
        (typeof object?.[campo] === 'string' && object[campo].trim() === '')) {
      const error: any = new Error(`Se requiere: ${campo}`);
      error.errorCode = 9999;
      error.userMessage = 'No se pudo completar la transacción';
      throw error;
    }
  }
}
