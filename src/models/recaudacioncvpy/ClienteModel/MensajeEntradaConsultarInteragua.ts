import { MensajeEntrada, Parametros } from "./MensajeEntradaConsultarRecaudacionAgua";

export interface MensajeEntradaConsultarInteragua extends MensajeEntrada {
    parametros: Parametros;
    opcion: string;
    tipoReferencia: string;
    ubicacion: string;
    rubroPerson: string;
    serviPerson: string;
  }