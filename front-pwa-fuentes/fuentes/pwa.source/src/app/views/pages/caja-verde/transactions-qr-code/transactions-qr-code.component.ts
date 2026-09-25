import { Component, OnInit } from '@angular/core';
import {Observable} from 'rxjs';
import {ConfigModel} from '../../../../core/caja-verde/_models/config.model';
import {TransactionModel} from '../../../../core/caja-verde/_models/transaction.model';
import {select, Store} from '@ngrx/store';
import {config, qr} from '../../../../core/caja-verde/_selectors/caja-verde.selectors';
import {AppState} from '../../../../core/reducers';
import {UtilsService} from '../../../../core/caja-verde/_services/utils.service';
import { DeviceDetectorService } from 'ngx-device-detector';
import { TransactionsAlertComponent } from '../transactions-alert/transactions-alert.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transactions-qr-code',
  templateUrl: './transactions-qr-code.component.html',
  styles: [
  ]
})
export class TransactionsQrCodeComponent implements OnInit {
  Transaction$: Observable<TransactionModel>;
  sizeQR = (screen.width < 768)?(screen.width * 0.71):(screen.width * 0.25);

  constructor(private store: Store<AppState>, 
              private utilsService: UtilsService, 
              private deviceService: DeviceDetectorService, 
              public matDialog: MatDialog,
              private router: Router,) { }

  ngOnInit(): void {
    this.Transaction$ = this.store.pipe(select(qr));
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
  public ToAddTransaction() {
    // change > for =
    // change > for =
    let cantidad = Number(localStorage.getItem('canTransactions'))+1;
    localStorage.setItem('canTransactions', String(cantidad));
    if(Number(localStorage.getItem('canTransactions')) >= Number(localStorage.getItem('canT'))){
      this.matDialog.open(TransactionsAlertComponent, {data: {message: 'Ha excedido el limite de transacciones permitidas en caja verde', action: ''}});
    } else {
      this.router.navigate(['transacciones']);
    }
    //this.router.navigate(['']);
  }
}
