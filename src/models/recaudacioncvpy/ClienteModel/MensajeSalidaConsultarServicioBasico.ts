// Interface for MensajeSalida
export interface MensajeSalida {
    codigoError?: string;
    codigoErrorRemoto?: string;
    estado?: string;
    mensajeSistema?: string;
    mensajeUsuario?: string;
    operacion?: string;
    secuencialBPM?: number;
    fechaProceso?: string; // ISO date format
    fechaTransaccion?: string; // ISO date-time format
    secuenciaTransaccion?: number;
    offline?: string;
  }
  
  // Enum for TipoPersona
  export enum TipoPersona {
    N = "N",
    J = "J"
  }
  
  // Enum for TipoIdentificacionPersona (assuming it exists based on references)
  export enum TipoIdentificacionPersona {
    // Define enum values here
    CED = "CED",
    RUC = "RUC",
    PASS = "PASS",
    // Add other types as needed
    C= "C",
    R="R",
    P="P"
  }
  
  // Interface for Identificacion
  export interface Identificacion {
    identificacion?: string;
    tipoIdentificacion?: TipoIdentificacionPersona;
  }
  
  // Interface for Cliente
  export interface Cliente extends Identificacion {
    tipoPersona: TipoPersona;
    nombre: string;
    enteMis: number | null;
    correo?: string;
    telefono?: string;
  }
  
  // Interface for ServicioBasico
  export interface ServicioBasico {
    cliente?: Cliente;
    deudaTotal?: number;
    comision?: number;
    montoMinimo?: number;
  }
  
  // Interface for MensajeSalidaConsultarServicioBasico
  export interface MensajeSalidaConsultarServicioBasico extends MensajeSalida {
    servicioBasico?: ServicioBasico;
  }


  export interface Client {
    identification: string;
    identificationType: string;
    name: string;
    mail: string;
    phone: string;
  }
  