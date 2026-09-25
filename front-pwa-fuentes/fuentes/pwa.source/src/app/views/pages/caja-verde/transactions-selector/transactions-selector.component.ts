import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import {hasTransaction} from '../../../../core/caja-verde/_selectors/caja-verde.selectors';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../../core/reducers';

@Component({
  selector: 'app-transactions-selector',
  templateUrl: './transactions-selector.component.html',
  styles: [],
})
export class TransactionsSelectorComponent implements OnInit {
  hasTransaccion$: Observable<boolean>;
  constructor(
    private router: Router,
    private translate: TranslateService,
    private store: Store<AppState>
  ) {}

  /*
   * Datos de los div de transacciones titulo, icono, y ruta, los cuales se crean dinamicamente.
   */
  public transactionsOptions: any = [
    {
      type: this.translate.instant(
        'SELECCION_TRANSACCION.TITLE_BUTTON_DEPOSITOS'
      ),
      icon: '../../../../../assets/images/icons/deposito.svg',
      route: '/formulario-de-deposito',
    },
    {
      type: this.translate.instant(
        'SELECCION_TRANSACCION.TITLE_BUTTON_PAGOTARJETA'
      ),
      icon: '../../../../../assets/images/icons/tarjeta.svg',
      route: '/pago-de-tarjeta',
    },
    {
      type: this.translate.instant(
        'SELECCION_TRANSACCION.TITLE_BUTTON_PAGOSERVICIOS'
      ),
      icon: '../../../../../assets/images/icons/pago_servicio.svg',
      route: '/pago-de-servicios',
    },
  ];

  ngOnInit(): void {
    this.hasTransaccion$ = this.store.pipe(select(hasTransaction));
  }

  /*
   * Método pública que permite navegar a la ruta principal.
   */
  public ToListTransaction() {
    this.router.navigate(['']);
  }
}
