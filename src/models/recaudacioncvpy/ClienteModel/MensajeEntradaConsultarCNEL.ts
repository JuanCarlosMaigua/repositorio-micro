import { MensajeEntrada, Parametros } from "./MensajeEntradaConsultarRecaudacionAgua";

export interface MensajeEntradaConsultarCNEL extends MensajeEntrada {
    parametros: Parametros;
    codigoAdquiriente: string;
    codigoAutorizador: string;
    codigoOperador: string;
    codigoSeguridad: string;
    servicioProveedor: string;
    tipoTransaccion: string;
  }