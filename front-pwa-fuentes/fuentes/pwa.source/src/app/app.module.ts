import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { TranslateModule } from '@ngx-translate/core';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import {AppRoutingModule} from './app-routing.module';
import {ThemeModule} from './views/theme/theme.module';
import {AuthGuard} from './core/caja-verde/_guards/auth.guard';
import {HashLocationStrategy, LocationStrategy } from '@angular/common';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {StoreRouterConnectingModule} from '@ngrx/router-store';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import { metaReducers, reducers } from './core/reducers';
import {CajaVerdeModule} from './views/pages/caja-verde/caja-verde.module';
import {SwiperModule} from 'swiper/angular';
import {CajaVerdeService} from './core/caja-verde/_services/caja-verde.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    TranslateModule.forRoot(),
    StoreModule.forRoot(reducers, { metaReducers }),
    EffectsModule.forRoot([]),
    StoreRouterConnectingModule.forRoot({ stateKey: 'router' }),
    StoreDevtoolsModule.instrument({
      maxAge: 30, // Retains last 25 states
      logOnly: environment.production, // Restrict extension to log-only mode
    }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    ThemeModule,
    CajaVerdeModule.forRoot(),
    SwiperModule
  ],
  exports: [
    TranslateModule
  ],
  providers: [
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    AuthGuard,
    CajaVerdeService],
  bootstrap: [AppComponent]
})
export class AppModule { }
