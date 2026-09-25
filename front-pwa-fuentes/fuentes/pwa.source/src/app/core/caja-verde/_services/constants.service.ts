import { Injectable } from '@angular/core';
import { environment } from "../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ConstantsService {

 //baseAppUrl = 'http://192.168.33.60:7009/';
 //baseAccountUrl = 'http://192.168.33.60:8081/';


   baseAppUrl = 'http://caja-verde-dev.us-east-2.elasticbeanstalk.com:7011/';
   baseAccountUrl = 'http://caja-verde-dev.us-east-2.elasticbeanstalk.com:8080/';
   // URLs: APP
   readonly urlGetTransactions = this.baseAppUrl + 'TransaccionCvPY/listarTransaccion/?device_id=';
   readonly urlAddTransaction = this.baseAppUrl + 'TransaccionCvPY/guardarTransaccion';
   readonly urlNewDevice = this.baseAppUrl + 'TransaccionCvPY/guardarDispositivo';
   readonly urlPullResponse = this.baseAppUrl + 'TransaccionCvPY/guardarEncuesta';
   readonly urlStarSession = this.baseAppUrl + 'TransaccionCvPY/iniciarSession';
   readonly urlCloseSession = this.baseAppUrl + 'TransaccionCvPY/cerrarSession';

   // URLs: Account
   readonly urlGetDataAccount = this.baseAccountUrl + 'CuentaCvPY/obtenerCuenta?accountNumber=';


    readonly urlGetTocken = 'https://cajaverde-dev.auth.us-east-1.amazoncognito.com/oauth2/token';
    readonly authorizationCode = 'Basic MXV0aDA1bDRoNWQ3NWUxMHI2Y3Frcm80NzM6a25sYnYzcTdoNnRnaWdqM3JuN3ZoYzdpcWtuZTZydTgwZ2Q3azJta2oyMXM2dTRiOXE2';
    readonly authorizationScope = 'cajaverde-dev-api/cajaverde-scope';
    readonly apiK = 'zgHsuUXJtf7JrkXFTCKE94Nqoyz946tj42MKnjgS';

  /*
    invokeURL = 'https://nnkoll6iyd.execute-api.us-east-1.amazonaws.com/CajaVerde';

      readonly urlGetTransactions = this.invokeURL + '/Transaccion/obtenerComprobante/?device_id=';
      readonly urlAddTransaction = this.invokeURL + '/Transaccion/almacenarComprobante/';
      readonly urlNewDevice = this.invokeURL + '/Transaccion/almacenarDispositivo/';
      readonly urlPullResponse = this.invokeURL + '/Transaccion/almacenarEncuesta/';
      readonly urlStarSession = this.invokeURL + '/Transaccion/iniciarSesion/';
      readonly urlCloseSession = this.invokeURL + '/Transaccion/cerrarSesion/';
      readonly urlGetDataAccount = this.invokeURL + '/Cuenta/obtenerCuenta/?accountNumber=';
*/

  constructor() { }
}
