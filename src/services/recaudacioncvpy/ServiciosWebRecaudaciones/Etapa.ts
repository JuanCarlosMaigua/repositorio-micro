import { BaseRecaudacionService } from './BaseRecaudacionService';
import { MensajeEntradaConsultarEtapa } from '../../../models/recaudacioncvpy/ClienteModel/MensajeEntradaConsultarEtapa';
import { MensajeSalidaConsultarServicioBasico } from '../../../models/recaudacioncvpy/ClienteModel/MensajeSalidaConsultarServicioBasico';

export class Etapa extends BaseRecaudacionService<MensajeEntradaConsultarEtapa> {

  async obtenerConsultaEtapa(body: MensajeEntradaConsultarEtapa): Promise<MensajeSalidaConsultarServicioBasico | null> {
    return this.obtenerConsulta(body,'ETAPA');

  }
  
  /**
   * Implementación específica para construir el envelope SOAP de Etapa
   */
  protected buildSoapEnvelope(body: MensajeEntradaConsultarEtapa): string {

    return this.buildBaseSoapEnvelope(
        body, 
        'MensajeEntradaConsultarEtapa',
        (xml) => {
          // Add CNT-specific fields
        }
      );

  }
}