import { BaseRecaudacionService } from './BaseRecaudacionService';
import { MensajeEntradaConsultarCNEL } from '../../../models/recaudacioncvpy/ClienteModel/MensajeEntradaConsultarCNEL';
import { MensajeSalidaConsultarServicioBasico } from '../../../models/recaudacioncvpy/ClienteModel/MensajeSalidaConsultarServicioBasico';

export class Cnel extends BaseRecaudacionService<MensajeEntradaConsultarCNEL> {

    async obtenerConsultaCnel(body: MensajeEntradaConsultarCNEL): Promise<MensajeSalidaConsultarServicioBasico | null> {
        return this.obtenerConsulta(body,'CNEL');
    }
    protected buildSoapEnvelope(body: MensajeEntradaConsultarCNEL): string {
        return this.buildBaseSoapEnvelope(
        body, 
        'MensajeEntradaConsultarCNEL',
        (xml) => {
            // Add CNEL-specific fields
            xml.push(`<codigoAdquiriente>${body.codigoAdquiriente || ''}</codigoAdquiriente>`);
            xml.push(`<codigoAutorizador>${body.codigoAutorizador || ''}</codigoAutorizador>`);
            xml.push(`<codigoOperador>${body.codigoOperador || ''}</codigoOperador>`);
            xml.push(`<codigoSeguridad>${body.codigoSeguridad || ''}</codigoSeguridad>`);
            xml.push(`<servicioProveedor>${body.parametros?.servicioProveedor || body.servicioProveedor || ''}</servicioProveedor>`);
            xml.push(`<tipoTransaccion>${body.tipoTransaccion || ''}</tipoTransaccion>`);
        }
        );
    }

}