// Angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import {AuthGuard} from './core/caja-verde/_guards/auth.guard';
import {BaseComponent} from './views/theme/base/base.component';
// Components

const routes: Routes = [
  { path: 'bienvenido',
    loadChildren: () => import('./views/pages/welcome/welcome.module').then(m => m.WelcomeModule)
  },
  { path: 'oops',
    loadChildren: () => import('./views/pages/error/error.module').then(m => m.ErrorModule)
  },
  {
    path: '',
    component: BaseComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import('./views/pages/caja-verde/caja-verde.module').then(m => m.CajaVerdeModule)
  },
  { path: '**', redirectTo: 'oops', pathMatch: 'full' },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forRoot(routes),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
