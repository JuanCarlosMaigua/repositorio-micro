import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomeComponent } from './welcome.component';
import { BoardingComponent } from './boarding/boarding.component';
import { CaptchaComponent } from './captcha/captcha.component';
import {RouterModule} from '@angular/router';
import {SwiperModule} from 'swiper/angular';


@NgModule({
  declarations: [
    WelcomeComponent,
    BoardingComponent,
    CaptchaComponent
  ],
    imports: [
        CommonModule,
        RouterModule.forChild([
            {
                path: '',
                component: BoardingComponent
            },
            {
                path: 'verificacion',
                component: CaptchaComponent
            },
        ]),
        SwiperModule,
    ]
})
export class WelcomeModule { }
