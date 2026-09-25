import { CustomError } from './customError';

export class Util {
  public static readonly errCode = '9999';
  public static readonly errCodeCtr = '-1';
  public static readonly errMessage = 'Transaccion No exitosa';
  public static readonly okCode = '0';
  public static readonly okMessage = 'Transaccion ok';

  public static validateVal(element: any, value: string): void {
    if (element === null || element === undefined || 
        (typeof element === 'string' && element.trim() === '')) {
      throw new CustomError(this.errCode, this.errMessage, `Se requiere ${value}`);
    }
  }

  public static getIdentificationType(identification: string): string {
    let ret = '';
    
    if (identification) {
      if (/^\d+$/.test(identification)) {  // Verificar si es numérico
        if (identification.length === 10) {
          ret = 'C';
        } else if (identification.length === 13) {
          ret = 'R';
        }
      } else {
        ret = 'P';
      }
    }
    
    return ret;
  }
}