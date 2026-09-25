import {ModuleWithProviders, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionsListComponent } from './transactions-list/transactions-list.component';
import { TransactionsSelectorComponent } from './transactions-selector/transactions-selector.component';
import { TransactionsVoucherComponent } from './transactions-voucher/transactions-voucher.component';
import { TransactionsQrCodeComponent } from './transactions-qr-code/transactions-qr-code.component';
import { TransactionsPollComponent } from './transactions-poll/transactions-poll.component';
import { TransactionsDepositComponent } from './transactions-deposit/transactions-deposit.component';
import { TransactionsBasicServicesComponent } from './transactions-basic-services/transactions-basic-services.component';
import { TransactionsCreditCardComponent } from './transactions-credit-card/transactions-credit-card.component';
import { TransactionsSignatureComponent } from './transactions-signature/transactions-signature.component';
import { CajaVerdeComponent } from './caja-verde.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import {MatOptionModule, MatRippleModule} from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {CajaVerdeRoutingModule} from './caja-verde-routing.module';
import {StoreModule} from '@ngrx/store';
import {cajaVerdeReducer} from '../../../core/caja-verde/_reducers/caja-verde.reducers';
import {HttpClientModule} from '@angular/common/http';
import {CajaVerdeEffects} from '../../../core/caja-verde/_effects/caja-verde.effects';
import {EffectsModule} from '@ngrx/effects';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { TransactionsAlertComponent } from './transactions-alert/transactions-alert.component';
import {MatDialogModule} from '@angular/material/dialog';
import {NgxCurrencyModule} from 'ngx-currency';
import {NgxKjuaModule} from 'ngx-kjua';
import {UtilsService} from '../../../core/caja-verde/_services/utils.service';
import { CredicardsListComponent } from './transactions-credit-card/credicards-list/credicards-list.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';

export const customCurrencyMaskConfig = {
  align: 'left',
  allowNegative: false,
  allowZero: true,
  decimal: '.',
  precision: 2,
  prefix: '',
  suffix: '',
  thousands: ',',
  nullable: false
};

@NgModule({
  declarations: [
    CajaVerdeComponent,
    TransactionsListComponent,
    TransactionsSelectorComponent,
    TransactionsDepositComponent,
    TransactionsBasicServicesComponent,
    TransactionsCreditCardComponent,
    TransactionsVoucherComponent,
    TransactionsQrCodeComponent,
    TransactionsPollComponent,
    TransactionsSignatureComponent,
    TransactionsAlertComponent,
    CredicardsListComponent,
  ],
    imports: [
        CommonModule,
        CajaVerdeRoutingModule,
        TranslateModule,
        StoreModule.forFeature('cajaVerde', cajaVerdeReducer),
        EffectsModule.forFeature([CajaVerdeEffects]),
        MatTabsModule,
        MatIconModule,
        MatGridListModule,
        MatButtonModule,
        MatRippleModule,
        MatFormFieldModule,
        MatInputModule,
        MatSlideToggleModule,
        ReactiveFormsModule,
        MatCardModule,
        HttpClientModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        NgxCurrencyModule.forRoot(customCurrencyMaskConfig),
        NgxKjuaModule,
        MatCheckboxModule,
        MatButtonToggleModule,
        FormsModule,
        MatSelectModule,
        MatOptionModule,
        MatTooltipModule,
    ],
  providers: [
    CajaVerdeComponent,
    UtilsService
  ],
})
export class CajaVerdeModule {
  static forRoot(): ModuleWithProviders<any> {
    return {
      ngModule: CajaVerdeModule,
      providers: [
      ]
    };
  }
}
