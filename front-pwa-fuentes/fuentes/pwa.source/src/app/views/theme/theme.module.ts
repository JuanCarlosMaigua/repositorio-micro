import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent } from './base/base.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { SplashScreenComponent } from './splash-screen/splash-screen.component';
import {RouterModule} from '@angular/router';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {LayoutConfigService} from '../../core/_base/services/layout-config.service';



@NgModule({
    declarations: [
        BaseComponent,
        HeaderComponent,
        FooterComponent,
        SplashScreenComponent
    ],
    exports: [
        SplashScreenComponent,
        HeaderComponent
    ],
    imports: [
        CommonModule,
        RouterModule,
      MatProgressBarModule
    ],
  providers: [
    LayoutConfigService
  ]
})
export class ThemeModule { }
