import { BaseRecaudacionService } from './BaseRecaudacionService';
import { MensajeEntradaConsultarMEER } from '../../../models/recaudacioncvpy/ClienteModel/MensajeEntradaConsultarMEER';
import { MensajeSalidaConsultarServicioBasico } from '../../../models/recaudacioncvpy/ClienteModel/MensajeSalidaConsultarServicioBasico';

export class Meer extends BaseRecaudacionService<MensajeEntradaConsultarMEER> {

  async obtenerConsultaMeer(body: MensajeEntradaConsultarMEER): Promise<MensajeSalidaConsultarServicioBasico | null> {
    return this.obtenerConsulta(body,'MEER');
  }
  
  /**
   * Implementación específica para construir el envelope SOAP de MEER
   */
  protected buildSoapEnvelope(body: MensajeEntradaConsultarMEER): string {
    return this.buildBaseSoapEnvelope(
        body, 
        'MensajeEntradaConsultarMEER',
        (xml) => {
          xml.push(`<informacionCore>`);
          xml.push(`            <codigoTRX>${body.informacionCore?.codigoTRX || ''}</codigoTRX>`);
          xml.push(`            <rolBPM>${body.informacionCore?.rolBPM || ''}</rolBPM>`);
          xml.push(`            <secuencial>${body.informacionCore?.secuencial || ''}</secuencial>`);
          xml.push(`            <servidor>${body.informacionCore?.servidor || ''}</servidor>`);
          xml.push(`            <servidorLocal>${body.informacionCore?.servidorLocal || ''}</servidorLocal>`);
          xml.push(`</informacionCore>`);
        }
      );  
  }
}