export interface MensajeEntradaConsultarRecaudacionAgua extends MensajeEntrada {
    parametros: Parametros;
  }
  
  export interface Parametros {
    aplicativoCobis: string;
    autorizacion: string;
    canalCobranza?: string;
    servicio?: string;
    empresa?: string;
    tipoMoneda?: string;
    codigoSuministro?: string;
    hora?: string;
    codigoTerminal: string;
    secuencial: string;
    consultaComision: string;
    monedaComision: string;
    canalComision: string;
    fechaTransaccionLocal?: string; // formato ISO: "2025-04-24T14:30:00Z"
    servicioProveedor: string;
  }
  

  export interface MensajeEntrada {
    archivo?: string;
    canal?: string;
    depuracion?: string;
    fecha?: string; // También en formato ISO 8601
    oficina?: number;
    proceso?: string;
    terminal?: string;
    transaccion?: number;
    secuencial?: string;
    usuario?: string;
  }