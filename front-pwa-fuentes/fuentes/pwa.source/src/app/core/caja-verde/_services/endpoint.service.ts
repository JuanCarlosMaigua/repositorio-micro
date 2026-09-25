import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { ConstantsService } from '../constants.service';
import {Observable} from 'rxjs';
import {Transaction} from '../../app/models/transaction.model';
import {Account} from '../../app/models/account.model';
import {map} from 'rxjs/operators';
import {DeviceModel} from '../../app/models/device.model';
import {SessionModel} from '../../app/models/session.model';

@Injectable({
  providedIn: 'root'
})

export class EndpointService {

  constructor(private http: HttpClient, private constantsService: ConstantsService) { }

  private tk;

  getAuthorization() {

    const params = new HttpParams({
      fromObject: {
        grant_type: 'client_credentials',
        scope: this.constantsService.authorizationScope,
      }
    });

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': this.constantsService.authorizationCode
      })
    };

    return this.http.post<any>(this.constantsService.urlGetTocken, params, httpOptions);
  }

  authorization() {
    let temp = {
      cod: String,
      expirationDate: Date
    };

    if (sessionStorage.getItem('caja_session') === null) {
      const params = new HttpParams({
        fromObject: {
          grant_type: 'client_credentials',
          scope: this.constantsService.authorizationScope,
        }
      });

      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': this.constantsService.authorizationCode
        })
      };

      this.http.post<any>(this.constantsService.urlGetTocken, params, httpOptions)
        .subscribe((res: any) => {
          const cod = res.token_type + ' ' + res.access_token;
          // @ts-ignore
          const hoy = new Date().setSeconds(res.expires_in);

          // @ts-ignore
          temp.cod = cod;
          this.tk = cod;
          // @ts-ignore
          temp.expirationDate = hoy;
          sessionStorage.caja_session = JSON.stringify(temp);
          return cod;

        });

    } else {

      const res  = JSON.parse(sessionStorage.getItem('caja_session'));
      // @ts-ignore
      if (res.expirationDate > new Date()) {
        this.tk = res.cod;
        return res.cod;
      } else {
        window.sessionStorage.removeItem('caja_session');
      }

    }

  }

  getTK(){
    return (this.authorization() !== '') ? this.authorization(): this.tk;
  }

  MyHeader(){
    const tkTemp = (this.authorization() !== '')? this.authorization(): this.tk;
    return  {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Authorization': tkTemp,
        'x-api-key': this.constantsService.apiK
      })
    };
  }

  // Prov:APP
  newDevice(deviceIdentifier, os): Observable<DeviceModel> {
    let body = '{  "id_device":"' + deviceIdentifier + '", "deviceOS":"' + os + '" }';
    return this.http.post( this.constantsService.urlNewDevice, body, this.MyHeader()).pipe(
      map( data => new DeviceModel().deserialize(data))
    );
  }

  addTransaction(data): Observable<Transaction> {
    return this.http.post( this.constantsService.urlAddTransaction, data, this.MyHeader()).pipe(
      map( data => new Transaction().deserialize(data))
    );
  }

  addPullResponse(transactionID, like, comment) {
    let respuesta = (like!=1)?'false':'true';
    let body = '{"transactionID":"' + transactionID + '", "like":' + respuesta + ', "comment":"' + comment + '"}';
    return this.http.post( this.constantsService.urlPullResponse, body, this.MyHeader());
  }

  closeSession(sessionID) {
    // @ts-ignore
    let body = '{ "sessionID":"' + sessionID + '", "sessionIPAgency":"' + String(0) + '" }';
    return this.http.post( this.constantsService.urlCloseSession, body, this.MyHeader());
  }

  starSession(data): Observable<SessionModel> {
    let body = '{ "id_device":"' + data + '" }';
    return this.http.post( this.constantsService.urlStarSession, body, this.MyHeader()).pipe(
      // tslint:disable-next-line:no-shadowed-variable
      map( data => new SessionModel().deserialize(data))
    );
  }

  getAllTransactions(deviceId): Observable<Transaction[]> {
    return this.http.get<Transaction[]>( this.constantsService.urlGetTransactions + deviceId, this.MyHeader()).pipe(
      // tslint:disable-next-line:no-shadowed-variable
      map(data => data.map( data => new Transaction().deserialize(data)) )
    );
  }

  // Prov: Account
  getDataAccount(numberAccount): Observable<Account> {
    const tkTemp = (this.authorization() !== '') ? this.authorization() : this.tk;
    return this.http.get<Account>( this.constantsService.urlGetDataAccount + numberAccount, {
      headers: new HttpHeaders({
        'Accept': '*/*',
        'Authorization': tkTemp,
        'x-api-key': this.constantsService.apiK
      })
    }).pipe(
      map( data => new Account().deserialize(data))
    );
  }
}
