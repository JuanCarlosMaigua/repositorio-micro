import { MensajeEntrada, Parametros } from "./MensajeEntradaConsultarRecaudacionAgua";

export interface MensajeEntradaConsultarEtapa extends MensajeEntrada {
    parametros?: Parametros;
    opcion?: string;
    tipoReferencia?: string;
    ubicacion?: string;
    rubroPerson?: string;
    serviPerson?: string;
  }