import { Component, OnInit } from '@angular/core';
import {Observable} from 'rxjs';
import {TransactionModel} from '../../../../core/caja-verde/_models/transaction.model';
import {select, Store} from '@ngrx/store';
import {voucher} from '../../../../core/caja-verde/_selectors/caja-verde.selectors';
import {AppState} from '../../../../core/reducers';
import {UtilsService} from '../../../../core/caja-verde/_services/utils.service';
import {Router} from '@angular/router';
import {RequestSavePollModel} from '../../../../core/caja-verde/_models/_request-save-poll.model';
import {SaveTransactionPoll} from '../../../../core/caja-verde/_actions/caja-verde.actions';

@Component({
  selector: 'app-transactions-poll',
  templateUrl: './transactions-poll.component.html',
  styles: [
  ]
})
export class TransactionsPollComponent implements OnInit {
  value: boolean | null = null;
  pollValue = false;
  empty?: boolean;
  commentValue = '';
  Transaction$: Observable<TransactionModel>;
  constructor(private store: Store<AppState>, private utilsService: UtilsService, private router: Router) { }

  ngOnInit(): void {
    this.Transaction$ = this.store.pipe(select(voucher));
  }

  check(i: boolean){
    this.value = i;
  }

  sendPoll(_transaction: TransactionModel) {
    const poll = new RequestSavePollModel();
    poll.pollId = _transaction.idTransaction;
    poll.comment = this.commentValue;
    poll.liked = this.value;
    poll.typeNemonic = _transaction.typeNemonic;
    this.store.dispatch( new SaveTransactionPoll({poll}) );
  }
}
