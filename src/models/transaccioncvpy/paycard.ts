import { MensajeEntrada } from '../recaudacioncvpy/ClienteModel/MensajeEntradaConsultarRecaudacionAgua';
import { MensajeSalida, TipoIdentificacionPersona, TipoPersona } from '../recaudacioncvpy/ClienteModel/MensajeSalidaConsultarServicioBasico';
import { Client } from '../shared/client';

export interface PayCard {
  cardNumber: string;
  cardKey: string;
  cardType: string;
  cardBrand: string;
  amountCash?: number;
  nCheck?: number;
  amountCheckBb?: number;
  amountCheckOb?: number;
  amountTotalCheckEx?: number;
  amountCheckMi?: number;
  amountCheckNy?: number;
  amountCheckOp?: number;
  totalAmount?: number;
  fundsSource?: string;
  fundsDestination?: string;
  client?: Client;
}

export interface MensajeSalidaGuardarTransaccion extends MensajeSalida {}

export interface MensajeEntradaGuardarTransaccion extends MensajeEntrada {
  transaccionCliente: Transaccion;
}

export interface Transaccion {
  idTransaccion: number;
  codigoCT: string;
  fechaCreacion?: string; // formato ISO 8601 (dateTime) o Date si se parsea
  tiempoMaximo?: number;
  tipoTransaccion?: string;
  idTipoTransaccion?: number;
  tipoAcceso?: string;
  dispositivo?: Dispositivo;
  depositante?: Cliente;
  cuenta?: Cuenta;
  tarjeta?: Tarjeta;
  servicio?: Servicio;
}


export interface Identificacion {
  identificacion?: string;
  tipoIdentificacion?: TipoIdentificacionPersona;
}

export interface Cliente extends Identificacion {
  tipoPersona?: TipoPersona;
  nombre?: string;
  enteMis?: number | null;
  correo?: string;
  telefono?: string;
}

export interface Tarjeta {
  cliente?: Cliente;
  numeroTarjeta?: string;
  codigoUnico?: string;
  tipo?: string;
  marca?: string;
  montoEfectivo?: number;
  cantidadCheque: number | null;
  montoChequeBb?: number;
  montoChequeOb?: number;
  totalChequesExterior?: number;
  montoChequeMi?: number;
  montoChequeNy?: number;
  montoChequeOp?: number;
  montoTotal?: number;
  fondoOrigen?: string;
  fondoDestino?: string;
}

export interface Dispositivo {
  identificador?: string;
  sistemaOperativo?: string;
  ip?: string;
}


export interface Servicio {
  cliente?: Cliente;
  empresa?: Empresa;
  codigoServicio?: string;
  cantidadCheque: number | null;
  factura: boolean | null;
  comision?: number;
  montoEfectivo?: number;
  montoCheque?: number;
  montoTotal?: number;
  montoMinimo?: number;
  deutaTotal?: number;
  fondoOrigen?: string;
  fondoDestino?: string;
}

export interface Empresa {
  idEmpresa: number | null;
  nombreEmpresa: string;
  idServicio: number | null;
  nombreServicio: string;
  tipo: Catalogo[];
  region: Catalogo[];
  area: Catalogo[];
}

export interface CatalogoDetalle {
  clave: string;
  valor: string;
}

export interface Catalogo {
  nemonico: string;
  catalogo: CatalogoDetalle[];
}

export interface Cuenta {
  cliente?: Cliente;
  numeroCuenta?: string;
  tipoCuenta?: string;
  montoEfectivo?: number;
  montoCheque?: number;
  cantidadCheque?: number | null;
  fondoOrigen?: string;
  fondoDestino?: string;
}

export interface Device {
  deviceId: number;
  uuId: string;
  macAddress: string;
  operatingSystem: string;
}

// Session class converted to TypeScript interface
// Note that it extends Device as in the Java implementation
export interface Session extends Device {
  sessionId: number;
  ipAgency: number;
  ip: string;
}