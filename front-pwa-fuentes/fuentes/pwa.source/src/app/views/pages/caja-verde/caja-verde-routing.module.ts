// Angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import {TransactionsListComponent} from './transactions-list/transactions-list.component';
import {TransactionsSelectorComponent} from './transactions-selector/transactions-selector.component';
import {TransactionsDepositComponent} from './transactions-deposit/transactions-deposit.component';
import {TransactionsBasicServicesComponent} from './transactions-basic-services/transactions-basic-services.component';
import {TransactionsCreditCardComponent} from './transactions-credit-card/transactions-credit-card.component';
import {TransactionsVoucherComponent} from './transactions-voucher/transactions-voucher.component';
import {TransactionsQrCodeComponent} from './transactions-qr-code/transactions-qr-code.component';
import {TransactionsPollComponent} from './transactions-poll/transactions-poll.component';
import {TransactionsSignatureComponent} from './transactions-signature/transactions-signature.component';
// Components

const routes: Routes = [
  {
    path: '',
    component: TransactionsListComponent,
  },
  {
    path: 'transacciones',
    component: TransactionsSelectorComponent,
  },
  {
    path: 'formulario-de-deposito',
    component: TransactionsDepositComponent,
  },
  {
    path: 'pago-de-servicios',
    component: TransactionsBasicServicesComponent,
  },
  {
    path: 'pago-de-tarjeta',
    component: TransactionsCreditCardComponent,
  },
  {
    path: 'comprobante',
    component: TransactionsVoucherComponent,
  },
  {
    path: 'codigo',
    component: TransactionsQrCodeComponent,
  },
  {
    path: 'encuesta',
    component: TransactionsPollComponent,
  },
  {
    path: 'firma',
    component: TransactionsSignatureComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule],
})
export class CajaVerdeRoutingModule {
}
