import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, of, Subject, Subscription,} from 'rxjs';
import {LayoutConfigService} from '../../../core/_base/services/layout-config.service';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {isConfigLoaded} from '../../../core/caja-verde/_selectors/caja-verde.selectors';
import {AppState} from '../../../core/reducers';
import {select, Store} from '@ngrx/store';
import {ActivatedRoute, Router, RouterEvent, RouterStateSnapshot} from '@angular/router';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styles: [],
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0
      })),
      transition(':leave', [
        animate(1000)
      ]),
    ])
  ]
})
export class SplashScreenComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  showSplash = true;
  errorRoute = '/oops';
  currentRoute: string;


  constructor(private store: Store<AppState>, private router: Router, private route:ActivatedRoute) {
  }

  ngOnInit(): void {

    this.subscriptions.push(this.store.pipe(select(isConfigLoaded)).subscribe(status => {
      this.showSplash = status;
    }));

    this.subscriptions.push(this.router.events.subscribe(status => {
      if (status instanceof RouterEvent) {
        this.currentRoute = status.url;
      }
    }));
  }

  /**
   * On Destroy
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach(el => el.unsubscribe());
  }

}
