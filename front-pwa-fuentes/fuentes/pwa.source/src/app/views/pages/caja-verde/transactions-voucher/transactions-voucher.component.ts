import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {qr, voucher} from '../../../../core/caja-verde/_selectors/caja-verde.selectors';
import {Observable} from 'rxjs';
import {TransactionModel} from '../../../../core/caja-verde/_models/transaction.model';
import {AppState} from '../../../../core/reducers';
import {UtilsService} from '../../../../core/caja-verde/_services/utils.service';
import {Router} from '@angular/router';
import html2canvas from 'html2canvas';
@Component({
  selector: 'app-transactions-voucher',
  templateUrl: './transactions-voucher.component.html',
  styles: [],
})
export class TransactionsVoucherComponent implements OnInit {
  Transaction$: Observable<TransactionModel>;
  @ViewChild('screen') screen: ElementRef;
  @ViewChild('canvas') canvas: ElementRef;
  @ViewChild('downloadLink') downloadLink: ElementRef;


  constructor(private store: Store<AppState>, private utilsService: UtilsService, private router: Router) {}

  ngOnInit() {
    this.Transaction$ = this.store.pipe(select(voucher));
  }

  getTotal(_transaction: TransactionModel) {
    return this.utilsService.getTotal(_transaction);
  }

  getName(_transaction: TransactionModel) {
    return this.utilsService.getName(_transaction);
  }

  getTransactionType(typeNemonic: string) {
    return this.utilsService.getTransactionType(typeNemonic);
  }

  getDescripcion(_transaction: TransactionModel) {
    return this.utilsService.getDescripcion(_transaction);
  }

  getNumberCheck(_transaction: TransactionModel) {
    return this.utilsService.getNumberCheck(_transaction);
  }

  getTotalCash(_transaction: TransactionModel) {
    return this.utilsService.getTotalCash(_transaction);
  }

  getTotalCheck(_transaction: TransactionModel) {
    return this.utilsService.getTotalCheck(_transaction);
  }

  back(_transaction: TransactionModel){
    if(_transaction.poll.pollId){
      this.router.navigateByUrl('/');
    } else {
      this.router.navigateByUrl('/encuesta');
    }
  }

  async downloadImage() {
    window.scroll(0, 0);
    html2canvas(this.screen.nativeElement).then(canvas => {
      this.downloadLink.nativeElement.href = canvas.toDataURL('image/png');
      this.downloadLink.nativeElement.download = 'comprobante.png';
      this.downloadLink.nativeElement.click();
    });
  }
}
