// Angular
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
// RxJS
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import {isRegistered} from '../_selectors/caja-verde.selectors';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../reducers';
// NGRX
// Auth reducers and selectors

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private store: Store<AppState>, private router: Router) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.store
      .pipe(
        select(isRegistered),
        tap(loggedIn => {
         if (!loggedIn) {
            this.router.navigateByUrl('/bienvenido');
         }
        })
      );
  }
   /* if (false) {
      this.router.navigate(['bienvenido']);
      return of(false);
    }
    return of(true);
  } */
}
