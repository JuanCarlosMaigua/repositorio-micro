// Angular
import { Injectable } from '@angular/core';
// RxJS
import {BehaviorSubject, Observable, of, Subject} from 'rxjs';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Router} from '@angular/router';
import {ResTokenModel} from '../_models/_res-token.model';
import {ResRegisterDeviceModel} from '../_models/_res-register-device.model';
import {RequestRegisterDeviceModel} from '../_models/_request-register-device.model';
import {ResStartSessionModel} from '../_models/_res-start-session.model';
import {ResLsitTransactionsModel} from '../_models/_res-lsit-transactions.model';
import {ResAccountModel} from '../_models/_res-account.model';
import {ResSaveTransactionsModel} from '../_models/_res-save-transactions.model';
import {ResCreditcardModel} from '../_models/_res-creditcard.model';
import {ConfigModel} from '../_models/config.model';
import {DeviceDetectorService} from 'ngx-device-detector';
import {ResServicesModel} from '../_models/_res-services.model';
import {ResCompanyModel} from '../_models/_res-company.model';
import {ResServiceModel} from '../_models/_res-service.model';

@Injectable()
export class CajaVerdeService {
  tokenApiGateway = new BehaviorSubject('NA');

  /**
   * Service constructor
   */
  constructor(private http: HttpClient, private router: Router) {
  }

  getTokenApiGateway(): Observable<ResTokenModel> {

    const params = new HttpParams({
      fromObject: {
        grant_type: 'client_credentials',
        scope: environment.apiGatewayScope,
      }
    });

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: environment.apiGatewayCode
      })
    };

    return this.http.post<any>(environment.oauth2URL, params, httpOptions);
  }

  setToken(token: string) {
    this.tokenApiGateway.next(token);
  }


  // @ts-ignore
  get token(): string {
    this.tokenApiGateway.getValue();
  }

  getHeaders(){
    // @ts-ignore
    return  {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: '*/*',
        Authorization: this.tokenApiGateway.getValue(),
        'x-api-key': environment.xApiKey
      })
    };
  }

  regDevice(request) {
    return this.http.post<ResRegisterDeviceModel>( environment.apiGatewayURL + '/Transaccion/almacenarDispositivo', request, this.getHeaders());
  }

  startSession(request) {
    return this.http.post<ResStartSessionModel>( environment.apiGatewayURL + '/Transaccion/iniciarSesion', request, this.getHeaders());
  }

  getInfoAccount(accountNumber) {
    return this.http.get<ResAccountModel>( environment.apiGatewayURL + '/Cuenta/obtenerCuenta?accountNumber=' + accountNumber, this.getHeaders());
  }

  listTransactions(request) {
    return this.http.post<ResLsitTransactionsModel>( environment.apiGatewayURL + '/Transaccion/obtenerComprobante', request, this.getHeaders());
  }

  saveTransactions(request) {
    return this.http.post<ResSaveTransactionsModel>( environment.apiGatewayURL + '/Transaccion/almacenarComprobante', request, this.getHeaders());
  }

  savePolls(request) {
    return this.http.post<ResSaveTransactionsModel>( environment.apiGatewayURL + '/Transaccion/almacenarEncuesta', request, this.getHeaders());
  }

  getCreditCards(request) {
    return this.http.post<ResCreditcardModel>( environment.apiGatewayURL + '/Transaccion/obtenertarjetas', request, this.getHeaders());
  }

  getServices() {
    return this.http.post<ResServicesModel>( environment.apiGatewayURL + '/Transaccion/obtenerservicios', {}, this.getHeaders());
  }


  getCompanies(request) {
    return this.http.post<ResCompanyModel>( environment.apiGatewayURL + '/Transaccion/obtenercompanias', request, this.getHeaders());
  }

  getService(request) {
    return this.http.post<ResServiceModel>( environment.apiGatewayURL + '/Transaccion/obtenerInformacionServicio', request, this.getHeaders());
  }







}
