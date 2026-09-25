import {Component, OnDestroy, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import {select, Store} from '@ngrx/store';
import {hasTransaction, lengthTransaction, transactions} from '../../../../core/caja-verde/_selectors/caja-verde.selectors';
import {distinct, distinctUntilChanged, pluck, tap} from 'rxjs/operators';
import {AppState} from '../../../../core/reducers';
import {interval, Observable, Subscription} from 'rxjs';
import {TransactionModel} from '../../../../core/caja-verde/_models/transaction.model';
import {HasTransactions, SaveTransactionsDeposit, ViewQR, ViewVoucher} from '../../../../core/caja-verde/_actions/caja-verde.actions';
import {CajaVerdeService} from '../../../../core/caja-verde/_services/caja-verde.service';
import {environment} from '../../../../../environments/environment';
import {UtilsService} from '../../../../core/caja-verde/_services/utils.service';
import {ConfigModel} from '../../../../core/caja-verde/_models/config.model';
import {config, isDesktop, sessionID} from '../../../../core/caja-verde/_selectors/caja-verde.selectors';
import {TransactionsAlertComponent} from '../transactions-alert/transactions-alert.component';
import {MatDialog} from '@angular/material/dialog';
import { DeviceDetectorService } from 'ngx-device-detector';

@Component({
  selector: 'app-transactions-list',
  templateUrl: './transactions-list.component.html',
  styles: [],
})
export class TransactionsListComponent implements OnInit, OnDestroy {
  /*
   * Comprueba si existe transacciones.
   */

  lengthT = 0;

  config: ConfigModel;
  transaccion$: Observable<TransactionModel[]>;

  public existsTransactions = true;

  private subscriptions: Subscription[] = [];

  /*
   *Array de transacciones Realizadas.
   */
  private varLocalStorage: string;


  constructor(
    private store: Store<AppState>,
    private router: Router,
    private cajaVerdeService: CajaVerdeService,
    private utilsService: UtilsService,
    public matDialog: MatDialog,
    private deviceService: DeviceDetectorService
  ) {


  }

  ngOnInit() {

    this.varLocalStorage = localStorage.getItem(environment.varLocalStorageDevice);

    this.transaccion$ = this.store.pipe(select(transactions));

    this.subscriptions.push(
      this.store.pipe(
        select(hasTransaction),
      ).subscribe(has => {

        if (!has) {
          this.router.navigateByUrl('/transacciones');
        }
      })
    );

    this.store.pipe(select(config)).subscribe(
      next => {
        this.config = next;
        localStorage.setItem('canT', String(this.config.canTransactions));
      }
    );

    this.subscriptions.push(
      interval(5000).subscribe(
        next=>{
          const requestListTransactions = {
            device: {
              deviceId: Number(this.varLocalStorage)
            }
          };
          this.cajaVerdeService.listTransactions(requestListTransactions).pipe(
            pluck('transactions'),
            distinctUntilChanged((prev, curr) => prev === curr),
            tap(ls => {
              localStorage.setItem('canTransactions', String(ls.length));
              this.lengthT = ls.length;
              if (ls.length > 0){
                this.store.dispatch(new HasTransactions({transactions: ls}));
                const words = ls.filter(transacctions => !transacctions.receipt.codTrans);
                console.log(words.length);
                // tslint:disable-next-line:triple-equals
                if(words.length == 0){
                  ( document.querySelectorAll('.mat-tab-label')[1] as HTMLElement).click();
                }
              }
            })
          ).subscribe()
        }
      )
    );


  }

  ngOnDestroy() {
    this.subscriptions.forEach(el => el.unsubscribe());
  }

  getTotal(_transaction: TransactionModel) {
    return this.utilsService.getTotal(_transaction);
  }

  getName(_transaction: TransactionModel) {
    return this.utilsService.getName(_transaction);
  }

  getTransactionType(typeNemonic: string) {
    return this.utilsService.getTransactionType(typeNemonic);
  }

  getDescripcion(_transaction: TransactionModel) {
    return this.utilsService.getDescripcion(_transaction);
  }

  getDateofExpiry(date: string){
    return this.utilsService.getDateofExpiry(date);
  }

  /*
   * Navigation Method to transactions-selector.
   */
  public ToAddTransaction() {
    // change > for =
    // change > for =
    if(Number(localStorage.getItem('canTransactions')) == this.config.canTransactions){
      this.matDialog.open(TransactionsAlertComponent, {data: {message: 'Ha excedido el limite de transacciones permitidas en caja verde', action: ''}});
    }else{
      this.router.navigate(['transacciones']);
    }
  }

  goToQr(transaction: TransactionModel){
    this.store.dispatch(new ViewQR({transaction}));
  }

  goToVoucher(transaction: TransactionModel){
    this.store.dispatch(new ViewVoucher({transaction}));
  }
}
