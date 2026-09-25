import { BaseRecaudacionService } from './BaseRecaudacionService';
import { MensajeEntradaConsultarRecaudacionAgua } from '../../../models/recaudacioncvpy/ClienteModel/MensajeEntradaConsultarRecaudacionAgua';
import { MensajeSalidaConsultarServicioBasico } from '../../../models/recaudacioncvpy/ClienteModel/MensajeSalidaConsultarServicioBasico';


export class RecaudacionAgua extends BaseRecaudacionService<MensajeEntradaConsultarRecaudacionAgua> {

  async obtenerConsultaAgua(body: MensajeEntradaConsultarRecaudacionAgua): Promise<MensajeSalidaConsultarServicioBasico | null> {
    return this.obtenerConsulta(body,'RECAUDACION_AGUA');
  }
  
  /**
   * Implementación específica para construir el envelope SOAP de Agua
   */

  protected buildSoapEnvelope(body: MensajeEntradaConsultarRecaudacionAgua): string {
    return this.buildBaseSoapEnvelope(
      body, 
      'MensajeEntradaConsultarRecaudacionAgua',
      (xml) => {
        // Add CNT-specific fields
      }
    );
  }

  
}