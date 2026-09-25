import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-credicards-list',
  templateUrl: './credicards-list.component.html',
  styles: [
  ]
})
export class CredicardsListComponent implements OnInit {
  public itemSelect: any = null;
  public creditCardSelectedChecked: any = [];
  public selected = -1;
  constructor(
    public dialogRef: MatDialogRef<CredicardsListComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: any,
    public dialog?: MatDialog
  ) {}

  ngOnInit(): void {

  }

  /*
   * Método público que controla los clicks en los checkbox para selección única obligatoria
    en caso que el checkbox este seleccionado no realiza ningun evento, caso contrario lo selecciona y lo agrega al
    objeto de item select que indica que tarjeta de crédito se ha escogido
   */

  public CreditCardClickEvent(item, event) {
  }

  /*
   * Método público que permite enviar la data al formulario inicial y que exista una tarjeta de crédito seleccionada
   */
  public SaveSelectedCreditCard() {
    this.dialogRef.close(this.itemSelect);
  }
}
