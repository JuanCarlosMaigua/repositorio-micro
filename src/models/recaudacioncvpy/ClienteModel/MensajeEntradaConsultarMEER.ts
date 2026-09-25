import { MensajeEntrada, Parametros } from "./MensajeEntradaConsultarRecaudacionAgua";

// Interfaces
export interface CoreRecaudacion {
    codigoTRX?: number | null;
    rolBPM?: string | null;
    secuencial?: number | null;
    servidor?: string | null;
    servidorLocal?: string | null;
}


export interface MensajeEntradaConsultarMEER extends MensajeEntrada {
    parametros: Parametros;
    informacionCore: CoreRecaudacion;
}
