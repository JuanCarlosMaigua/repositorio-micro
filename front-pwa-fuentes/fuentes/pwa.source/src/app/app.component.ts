import { Component } from '@angular/core';
import { locale as esLang } from './core/_config/i18n/es';
import {TranslationService} from './core/_base/services/translation.service';
import {CajaVerdeService} from './core/caja-verde/_services/caja-verde.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'body[Caja-Verde]',
  templateUrl: './app.component.html',
  styleUrls: []
})
export class AppComponent {
  title = 'Banco Bolivariano - Caja Verde';

  constructor(private translationService: TranslationService, private cajaVerdeService: CajaVerdeService) {
    this.translationService.loadTranslations(esLang);
  }
}
