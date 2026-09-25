import { BaseRecaudacionService } from './BaseRecaudacionService';
import { MensajeEntradaConsultarCNT } from '../../../models/recaudacioncvpy/ClienteModel/MensajeEntradaConsultarCNT';
import { MensajeSalidaConsultarServicioBasico } from '../../../models/recaudacioncvpy/ClienteModel/MensajeSalidaConsultarServicioBasico';

export class Cnt extends BaseRecaudacionService<MensajeEntradaConsultarCNT> {

  async obtenerConsultaCnt(body: MensajeEntradaConsultarCNT): Promise<MensajeSalidaConsultarServicioBasico | null> {
    return this.obtenerConsulta(body,'CNT');

  }
  
  /**
   * Implementación específica para construir el envelope SOAP de CNT
   */
  protected buildSoapEnvelope(body: MensajeEntradaConsultarCNT): string {
    return this.buildBaseSoapEnvelope(
      body, 
      'MensajeEntradaConsultarCNT',
      (xml) => {
        // Add CNT-specific fields
        xml.push(`            <codigoComercio>${body.codigoComercio}</codigoComercio>`);
        xml.push(`            <codigoProveedor>${body.codigoProveedor}</codigoProveedor>`);
        xml.push(`            <codigoTransaccion>${body.codigoTransaccion}</codigoTransaccion>`);
        xml.push(`            <consComision>${body.consComision}</consComision>`);
        xml.push(`            <criterioConsulta>${body.criterioConsulta}</criterioConsulta>`);
        xml.push(`            <servicio>${body.servicio}</servicio>`);
        xml.push(`            <tipoServicio>${body.tipoServicio}</tipoServicio>`);
      }
    );

  }
}