import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorComponent } from './error.component';
import {RouterModule} from '@angular/router';
import {MatDialogModule} from '@angular/material/dialog';
import {ThemeModule} from '../../theme/theme.module';

@NgModule({
  declarations: [ErrorComponent],
    imports: [
        CommonModule,
        RouterModule.forChild([
            {
                path: '',
                component: ErrorComponent
            },
        ]),
        ThemeModule,
    ]
})
export class ErrorModule { }
