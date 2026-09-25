import {Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
// import Swiper core and required modules
import { SwiperComponent } from 'swiper/angular';

// import Swiper core and required modules
import SwiperCore, { Navigation } from 'swiper/core';
import {Observable, Subscription} from 'rxjs';
import {ConfigModel} from '../../../../core/caja-verde/_models/config.model';
import {select, Store} from '@ngrx/store';
import {config, hasTransaction, isConfigLoaded, isDesktop, isNotDesktop} from '../../../../core/caja-verde/_selectors/caja-verde.selectors';
import {AppState} from '../../../../core/reducers';
import {Router} from '@angular/router';

// install Swiper modules
SwiperCore.use([Navigation]);
@Component({
  selector: 'app-boarding',
  templateUrl: './boarding.component.html',
  styles: [
  ],
  encapsulation: ViewEncapsulation.None,
})
export class BoardingComponent implements OnInit, OnDestroy {
  config$: Observable<ConfigModel>;
  isDesktop$: Observable<boolean>;
  isDesktop: boolean;
  isNotDesktop$: Observable<boolean>;
  private y: string;
  @ViewChild(SwiperComponent) componentRefer: SwiperComponent;
  currentIndex = 0;
  yButton = 0;
  showSplash = true;
  private subscriptions: Subscription[] = [];

  constructor(private store: Store<AppState>, private router: Router) { }

  ngOnInit(): void {
    this.config$ = this.store.pipe(select(config));
    this.isDesktop$ = this.store.pipe(select(isDesktop));
    this.store.pipe(select(isDesktop)).subscribe(
      next=>{
        if(next){
          this.isDesktop = true;
        } else {
          this.isDesktop = false;
        }
        this.yButton = (next) ? 10 : parseFloat(this.y) - (parseFloat(this.y) * 0.27);
      }
    );

    this.isNotDesktop$ = this.store.pipe(select(isNotDesktop));
    this.y = (screen.height * 0.5).toFixed(2);
    this.subscriptions.push(this.store.pipe(select(isConfigLoaded)).subscribe(status => {
      this.showSplash = status;
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(el => el.unsubscribe());
  }

  public onIndexChange(index: number) {
    this.currentIndex = index;
  }

  swipeToNextSlideManually() {
      const indx = this.currentIndex + 1;
      this.componentRefer.setIndex(indx);
      if(indx === 4){
        this.skip();
      }
  }

  skip() {
    this.router.navigate(['/']);
  }

}
