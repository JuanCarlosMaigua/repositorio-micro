import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {Router} from '@angular/router';

@Component({
  selector: 'app-transactions-alert',
  templateUrl: './transactions-alert.component.html',
  styles: [
  ]
})
export class TransactionsAlertComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public router: Router
  ) { }

  ngOnInit(): void {
  }

  onClick() {
    switch (this.data.action) {
      case 'reload':
        window.location.reload();
        break;
      case 'goToHome':
        this.router.navigateByUrl('/');
        break;
      default:
        break;
    }
  }

}
