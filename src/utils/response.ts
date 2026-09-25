import { APIGatewayProxyResult } from 'aws-lambda';
import { logger } from './logger';

export const Util = {
  errCode: '9999',
  errCodeCtr: '-1',
  errMessage: 'Transaccion No exitosa',
  okCode: '0',
  okMessage: 'Transaccion ok',
  okError : "NO SE PUDO OBTENER RESPUESTA DEL PROVEEDOR",
  
  getRoundVal(val: number | undefined): number | undefined {
    if (val !== undefined) {
      return Math.round(val * 100) / 100;
    }
    return val;
  },

  sanitizeForLog(input: any): string {
    if (input === null || input === undefined) {
      return '';
    }

    if (typeof input === 'object') {
      try {
        // Sanitizar el objeto antes de convertir a JSON
        const sanitized = this.sanitizeObjectForLog(input);
        return JSON.stringify(sanitized, null, 2)
          .replace(/[\r\n]+/g, ' ')
          .replace(/[^\x20-\x7E]+/g, '');
      } catch (e) {
        logger.error('Error al serializar objeto para log:', e);
        return '[Unserializable Object]';
      }
    }

    if (typeof input === 'string') {
      return this.sanitizeStringForLog(input);
    }

    return String(input);
  },

  // Función auxiliar para sanitizar objetos en logs
  sanitizeObjectForLog(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth', 'credential',
      'api_key', 'apikey', 'authorization', 'session', 'cookie',
      'pwd', 'pass', 'auth_token', 'access_token', 'refresh_token'
    ];

    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(sensitiveKey =>
        lowerKey.includes(sensitiveKey)
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObjectForLog(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  },

  // Función auxiliar para sanitizar strings en logs
  sanitizeStringForLog(input: string): string {
    return input
      .replace(/[\r\n]+/g, ' ')
      .replace(/[^\x20-\x7E]+/g, '')
      // Redactar patrones que parecen tokens o claves
      .replace(/\b[A-Za-z0-9+/]{20,}\b/g, '[REDACTED_TOKEN]')
      .replace(/\b[A-Fa-f0-9]{32,}\b/g, '[REDACTED_HASH]')
      // Redactar números de tarjeta de crédito
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED_CARD]');
  },
  /*getIdentificationType(identification: string | null | undefined): string {
    if (!identification) return '';
    
    // Verificar si la identificación es numérica
    if (/^\d+$/.test(identification)) {
      if (identification.length === 10) return 'C';
      if (identification.length === 13) return 'R';
    }
    
    return 'P';
  }*/
  getIdentificationType(identification: string): string {
    let ret: string = "";
    
    if (identification != null && identification !== "") {
      if (this.isNumeric(identification)) {
        if (identification.length === 10) {
          ret = "C";
        } else if (identification.length === 13) {
          ret = "R";
        }
      } else {
        ret = "P";
      }
    }
    
    return ret;
  },
  
  // Método auxiliar para verificar si el string es numérico
  isNumeric(str: string): boolean {
    return /^\d+$/.test(str);
  },

  listaBlancaCamposPermitirAsterisco: [
    'transaction.depositor.name',
    'transaction.deposit.client.name',
    'deposit.client.name',
    'depositor.name',
    'dateTrans',
    'sign',
    'transaction.deposit.sign'
  ],

  camposExcluidosDeValidacion: [
    'transaction.deposit.client.name',
    'depositor.name',
    'transaction.depositor.name'
  ],

  validarString(input: string, nombreCampo = 'campo'): string | null {
    if (!input) return null;

    // Si el campo está en la lista de exclusión, no validar nada
    if (this.camposExcluidosDeValidacion.includes(nombreCampo)) {
      return null;
    }
    const MENSAJE_CARACTERES_PELIGROSOS = "Valor no permitido";

    // Palabras clave SQL a buscar (case-insensitive, aunque estén dentro de otros textos)
    const palabrasSQL = [
      'SELECT', 'INSERT', 'DELETE', 'DROP', 'UNION', 'UPDATE', 'EXEC', 'CREATE', 'ALTER', 'TRUNCATE'
    ];
    for (const palabra of palabrasSQL) {
      const regex = new RegExp(palabra, 'i');
      if (regex.test(input)) {
        return MENSAJE_CARACTERES_PELIGROSOS;
      }
    }

    // Caracteres especiales prohibidos globales
    // Si el campo está en la lista blanca, * se permite

    const permitirListaBlanca = this.listaBlancaCamposPermitirAsterisco.includes(nombreCampo);
    // Si está en lista blanca, permite *, <, > y /
    const patternCaracteresEspeciales = permitirListaBlanca
      ? /[\^$|\\%?]/g
      : /[\^$|*\\%?<>/]/g;

    // Validar caracteres especiales
    if (patternCaracteresEspeciales.test(input)) {
      return MENSAJE_CARACTERES_PELIGROSOS;
    }

    // Validar etiquetas HTML y <script>
    const patronesPeligrososGenerales: { pattern: RegExp; tipo: string }[] = [
      // Patrón seguro para <script> con menor riesgo de ReDoS
      { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, tipo: MENSAJE_CARACTERES_PELIGROSOS },
      // Patrón más robusto y seguro para etiquetas HTML
      { pattern: /<[^<>]+?>/g, tipo: MENSAJE_CARACTERES_PELIGROSOS },
      // Comillas y comentarios de SQL
      { pattern: /(['"`])|(--|#|\/\*|\*\/)/g, tipo: MENSAJE_CARACTERES_PELIGROSOS },
      // Aquí eliminamos el patrón que prohibía * de forma general
      { pattern: /["'`´]|--|\/\*|\*\/|#/g, tipo: MENSAJE_CARACTERES_PELIGROSOS },
    ];

    for (const { pattern, tipo } of patronesPeligrososGenerales) {
      if (pattern.test(input)) {
        return `${tipo}`;
      }
    }

    return null;
  },

  validarStringsEnObjeto(obj: any, path: string[] = []): string[] {
    const errores: string[] = [];

    for (const clave in obj) {
      if (!obj.hasOwnProperty(clave)) continue;
      const valor = obj[clave];
      const rutaActual = [...path, clave];

      if (typeof valor === 'string') {
        const mensaje = this.validarString(valor, rutaActual.join('.'));
        if (mensaje) errores.push(mensaje);
      } else if (typeof valor === 'object' && valor !== null) {
        errores.push(...this.validarStringsEnObjeto(valor, rutaActual));
      }
    }

    return errores;
  },

   camposSoloNumeros: ['accountNumber','phone' ],

  validarCampoNumerico(
    valor: string | undefined | null,
    nombreCampo = 'campo'
  ): string | null {

    const valorTrim = (valor ?? '').trim() ;
    if(valorTrim){
      if (this.camposSoloNumeros.includes(nombreCampo)) {
        if (!/^\d+$/.test(valorTrim)) {
          return `El campo '${nombreCampo}' debe contener solo números`;
        }
      } else if (!/^[a-zA-Z0-9]+$/.test(valorTrim)) {
        return `El campo '${nombreCampo}' debe contener solo caracteres alfanuméricos`;
      }
  
      if (valorTrim.length > 30) {
        return `El campo '${nombreCampo}' no debe exceder 30 caracteres`;
      }
    }
    return null;
  }
  
};

// Función para obtener las cabeceras CORS dinámicamente
const getCorsHeaders = (): Record<string, string> => {
  const URL_CORS = process.env.URL_CORS || '*';
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': URL_CORS,
    //'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
   // 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
   // Seguridad
   'X-Content-Type-Options': 'nosniff',  // Previene que el navegador interprete el tipo MIME
   'Referrer-Policy': 'no-referrer',     // No enviar referrer a otros sitios
   'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload', // Fuerza HTTPS
   'X-Frame-Options': 'DENY',            // Previene que sea embebido en iframes (clickjacking)
   'Cache-Control': 'no-store',          // Evita almacenamiento de respuestas sensibles
   'Content-Security-Policy': "default-src 'self'", // Previene XSS controlando recursos cargados
   'Permissions-Policy': 'geolocation=(), camera=(), microphone=()' // Restringe acceso a APIs
  };
};

export const createResponse = (
  statusCode: number,
  body: any,
  headers: Record<string, string> = getCorsHeaders()
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
};

export const createSuccessResponse = (body: any): APIGatewayProxyResult => {
  return createResponse(200, body);
};

export const createErrorResponse = (
  errorCode: string = Util.errCode,
  userMessage: string = 'OCURRIÓ UN ERROR AL CONSULTAR EL SERVICIO',
  systemMessage: string = 'OCURRIÓ UN ERROR AL CONSULTAR EL SERVICIO'
): APIGatewayProxyResult => {
  return createResponse(500, {
    errorCode,
    userMessage,
    systemMessage
  });
};

export const createErrorTokenResponse = (
  errorCode: string = Util.errCode,
  userMessage: string = 'OCURRIÓ UN ERROR AL CONSULTAR EL SERVICIO',
  systemMessage: string = 'OCURRIÓ UN ERROR AL CONSULTAR EL SERVICIO'
): APIGatewayProxyResult => {
  return createResponse(403, {
    errorCode,
    userMessage,
    systemMessage
  });
};
