// Angular
import { Injectable } from '@angular/core';
// RxJS
import {Observable, Subject} from 'rxjs';


const localStorageKey = 'layoutConfig';

@Injectable()
export class LayoutConfigService {
  loading$: Subject<boolean> = new Subject<boolean>();

  /**
   * Service constructor
   */
  constructor() {
    // TODO: DELETE
    setTimeout(() => this.saludo(), 1000);
  }
  // TODO: DELETE
  saludo(){
    this.loading$.next(false);
    return false;
  }

  loading(o: boolean) {
    this.loading$.next(o);
  }

  get loadingStatus(): Observable<boolean> {
    return this.loading$;
  }
}
