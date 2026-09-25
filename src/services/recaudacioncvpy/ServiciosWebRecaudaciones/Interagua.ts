import { BaseRecaudacionService } from './BaseRecaudacionService';
import { MensajeEntradaConsultarInteragua } from '../../../models/recaudacioncvpy/ClienteModel/MensajeEntradaConsultarInteragua';
import { MensajeSalidaConsultarServicioBasico } from '../../../models/recaudacioncvpy/ClienteModel/MensajeSalidaConsultarServicioBasico';


export class Interagua extends BaseRecaudacionService<MensajeEntradaConsultarInteragua> {

  async obtenerConsultaInteragua(body: MensajeEntradaConsultarInteragua): Promise<MensajeSalidaConsultarServicioBasico | null> {
    return this.obtenerConsulta(body,'INTERAGUA');

  }
  
  /**
   * Implementación específica para construir el envelope SOAP de Interagua
   */
  protected buildSoapEnvelope(body: MensajeEntradaConsultarInteragua): string {

    return this.buildBaseSoapEnvelope(
        body, 
        'MensajeEntradaConsultarInteragua',
        (xml) => {
          // Add CNT-specific fields
          xml.push(`            <opcion>${body.opcion || ''}</opcion>`);
          xml.push(`            <tipoReferencia>${body.tipoReferencia || ''}</tipoReferencia>`);
          xml.push(`            <ubicacion>${body.ubicacion || ''}</ubicacion>`);
          xml.push(`            <rubroPerson>${body.rubroPerson || ''}</rubroPerson>`);
          xml.push(`            <serviPerson>${body.serviPerson || ''}</serviPerson>`);
        }
      );
  }
}