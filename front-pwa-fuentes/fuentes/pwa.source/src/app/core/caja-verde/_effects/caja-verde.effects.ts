// Angular
import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
// RxJS
import { filter, mergeMap, tap, withLatestFrom } from 'rxjs/operators';
import { defer, Observable, of } from 'rxjs';
// NGRX
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, select, Store } from '@ngrx/store';
import {AppState} from '../../reducers';
import {environment} from '../../../../environments/environment';
import {
  CajaVerdeActionTypes, HasTransactions,
  RegisterDevice,
  RegisterDeviceRequested, SaveTransactionPoll, SaveTransactionsDeposit,
  StartSession,
  StartSessionRequested, ViewQR, ViewVoucher
} from '../_actions/caja-verde.actions';
import {CajaVerdeService} from '../_services/caja-verde.service';
import {RequestRegisterDeviceModel} from '../_models/_request-register-device.model';
import { v4 as uuidv4 } from 'uuid';
import {DeviceDetectorService} from 'ngx-device-detector';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class CajaVerdeEffects {

  @Effect({ dispatch: false })
  RecuestRegisterDevice = this.actions$.pipe(
    ofType<RegisterDeviceRequested>(CajaVerdeActionTypes.RecuestRegisterDevice),
    tap(action => {

      let deviceID: number;

      this.cajaVerdeService.getTokenApiGateway().subscribe(
        next => {
          this.cajaVerdeService.setToken(next.token_type + ' ' + next.access_token);
          const requestRegisterDevice = {
            device: {
              uuId: uuidv4().substr(0, 15),
              operatingSystem:this.deviceService.getDeviceInfo().os
            }
          };

          this.cajaVerdeService.regDevice(requestRegisterDevice).subscribe(
            rest => {
              if(rest.errorCode !== '0'){
                this.router.navigateByUrl('/oops');
              }else{
                deviceID = rest.device.deviceId;
                let ipAddress;

                this.http.get<{ip:string}>('https://jsonip.com')
                  .subscribe( data => {
                    ipAddress = data

                      const requestStartSession = {
                        session: {
                          deviceId: rest.device.deviceId,
                          ip:ipAddress.ip
                        }
                      };

                    this.cajaVerdeService.startSession(requestStartSession).subscribe(
                      resSession =>{
                        localStorage.setItem(environment.varLocalStorageDevice, String(deviceID));

                        this.store.dispatch(new RegisterDevice({
                          deviceId: deviceID,
                          sessionID: resSession.session.sessionId,
                          deviceType: (this.deviceService.isDesktop())?'Desktop':'Mobile',
                          config: resSession.configuration
                        }));
                      },
                      error => {
                        this.router.navigateByUrl('/oops');
                      }
                    );
                  },
                    error => {
                      this.router.navigateByUrl('/oops');
                    }
                  );

              }
            }
          );


        },
        err =>{
          this.router.navigateByUrl('/oops');
        }
      );

    }),
  );


  @Effect({ dispatch: false })
  RecuestStartSession = this.actions$.pipe(
    ofType<StartSessionRequested>(CajaVerdeActionTypes.RecuestStartSession),
    tap(action => {

      this.cajaVerdeService.getTokenApiGateway().subscribe(
        next => {
          this.cajaVerdeService.setToken(next.token_type + ' ' + next.access_token);
          let ipAddress;
          const varLocalStorage = localStorage.getItem(environment.varLocalStorageDevice);

          this.http.get<{ip:string}>('https://jsonip.com')
            .subscribe( data => {
                ipAddress = data

                const requestStartSession = {
                  session: {
                    deviceId: varLocalStorage,
                    ip:ipAddress.ip
                  }
                };

                this.cajaVerdeService.startSession(requestStartSession).subscribe(
                  resSession =>{

                    const requestListTransactions = {
                      device: {
                        deviceId: Number(varLocalStorage)
                      }
                    };

                    this.cajaVerdeService.listTransactions(requestListTransactions).subscribe(
                      ls =>{
                        if (ls.transactions.length > 0){
                          this.store.dispatch(new HasTransactions({transactions: ls.transactions}));
                        }

                        this.store.dispatch(new StartSession({
                          deviceId: Number(varLocalStorage),
                          sessionID: resSession.session.sessionId,
                          config: resSession.configuration
                        }));

                        this.router.navigateByUrl('/');
                      },
                      e =>{
                        this.router.navigateByUrl('/oops');
                      }
                    );
                  },
                  error => {
                    this.router.navigateByUrl('/oops');
                  }
                );
              },
              error => {
                this.router.navigateByUrl('/oops');
              }
            );},
        e =>{
          this.router.navigateByUrl('/oops');
        }
      );

    }),
  );
  @Effect({ dispatch: false })
  viewVoucher = this.actions$.pipe(
    ofType<ViewVoucher>(CajaVerdeActionTypes.viewVoucher),
    tap(({payload}) => {
      this.router.navigateByUrl('/comprobante');
      return;
    })
  );

  @Effect({ dispatch: false })
  viewQR = this.actions$.pipe(
    ofType<ViewQR>(CajaVerdeActionTypes.viewQR),
    tap(({payload}) => {
      this.router.navigateByUrl('/codigo');
      return;
    })
  );


  @Effect({ dispatch: false })
  SaveTransactionPoll = this.actions$.pipe(
    ofType<SaveTransactionPoll>(CajaVerdeActionTypes.saveTransactionPollRequest),
    tap(({payload}) => {
      this.cajaVerdeService.savePolls(payload).subscribe(
          next=>{
            this.router.navigateByUrl('/');
            return;
          }
      );

    })
  );


  @Effect({ dispatch: false })
  saveTransactionsDepositRequest = this.actions$.pipe(
    ofType<SaveTransactionsDeposit>(CajaVerdeActionTypes.saveTransactionsDepositRequest),
    tap(({payload}) => {
      localStorage.setItem('test', JSON.stringify({transaction: payload.transaction}));
      this.cajaVerdeService.saveTransactions({transaction: payload.transaction}).subscribe(
        next=>{
          localStorage.removeItem('datosDeposit');
          this.store.dispatch(new ViewQR({
            transaction: next.transaction
          }));
        },
        error => {
          this.router.navigateByUrl('/oops');
        }
      );

    }),
  );

  @Effect()
  init$: Observable<Action> = defer(() => {
    const varLocalStorage = localStorage.getItem(environment.varLocalStorageDevice);
    let observableResult = of({ type: 'NO_ACTION' });
    if (varLocalStorage) {
      observableResult = of(new StartSessionRequested());
    } else {
      observableResult = of(new RegisterDeviceRequested());
    }
    return observableResult;
  });

  private returnUrl: string;

  constructor (private actions$: Actions,
    private router: Router,
    private http: HttpClient,
    private deviceService: DeviceDetectorService,
    private cajaVerdeService: CajaVerdeService,
    private store: Store<AppState>) {

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.returnUrl = event.url;
      }
    });
  }
}
