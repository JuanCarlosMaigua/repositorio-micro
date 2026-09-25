import { MensajeEntrada, Parametros } from "./MensajeEntradaConsultarRecaudacionAgua";

export interface MensajeEntradaConsultarCNT extends MensajeEntrada {
    parametros: Parametros;
    codigoComercio: string;
    codigoProveedor: string;
    codigoTransaccion: string;
    consComision: string;
    criterioConsulta: string;
    servicio: string;
    tipoServicio: string;
  }