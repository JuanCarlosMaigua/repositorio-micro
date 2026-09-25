import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewRef } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { AccountModel } from '../../../../core/caja-verde/_models/account.model';
import { CajaVerdeService } from '../../../../core/caja-verde/_services/caja-verde.service';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { config, isDesktop, sessionID } from '../../../../core/caja-verde/_selectors/caja-verde.selectors';
import { Observable } from 'rxjs';
import { ConfigModel } from '../../../../core/caja-verde/_models/config.model';
import { AppState } from '../../../../core/reducers';
import { TransactionsAlertComponent } from '../transactions-alert/transactions-alert.component';
import { MatDialog } from '@angular/material/dialog';
import { animate, style, transition, trigger } from '@angular/animations';
import { DepositModel } from '../../../../core/caja-verde/_models/deposit.model';
import { RequestTransactionDepositModel } from '../../../../core/caja-verde/_models/_request-transaction-deposit.model';
import { environment } from '../../../../../environments/environment';
import { SaveTransactionsDeposit } from '../../../../core/caja-verde/_actions/caja-verde.actions';
import { ClientModel } from '../../../../core/caja-verde/_models/client.model';
import { SessionModel } from '../../../../core/caja-verde/_models/session.model';
import { DepositorModel } from '../../../../core/caja-verde/_models/depositor.model';
import { DeviceDetectorService } from 'ngx-device-detector';

@Component({
  selector: 'app-transactions-deposit',
  templateUrl: './transactions-deposit.component.html',
  styles: [
  ],
  animations: [
    trigger(
      'enterAnimation', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('0.5s ease-out', style({ height: 50, opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: 50, opacity: 1 }),
        animate('0.5s ease-in', style({ height: 0, opacity: 0 }))
      ])
    ]
    )
  ]
})
export class TransactionsDepositComponent implements OnInit {
  public formGroupDeposit: FormGroup;
  queryIntents = 0;
  queryIntentsConfig = 3;
  accountInfo: AccountModel;
  accountInfoLoad = false;
  AcountNotFound = false;
  isDesktop$: Observable<boolean>;
  sessionID$: Observable<number>;
  sessionID: number;
  config: ConfigModel;

  emonicLocalStorageDataTemp = 'datosDeposit';
  isSignEmpty = true;
  private signature = '';
  total = 0;
  isSignEmptyerror = false;
  unsend = false;
  noDNI = [
    '1111111111',
    '2222222222',
    '3333333333',
    '4444444444',
    '5555555555',
    '6666666666',
    '7777777777',
    '8888888888',
    '9999999999',
    '0000000000',
  ];
  constructor(
    private formBuilder: FormBuilder,
    private cajaVerdeService: CajaVerdeService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private store: Store<AppState>,
    public matDialog: MatDialog,
    private deviceService: DeviceDetectorService
  ) { }

  ngOnInit() {
    this.queryIntents = 0;
    this.store.pipe(select(config)).subscribe(
      next => {
        this.config = next;
      }
    );

    this.isDesktop$ = this.store.pipe(select(isDesktop));
    this.initForm();

    this.store.pipe(select(sessionID)).subscribe(
      next => {
        this.sessionID = next;
      }
    );
  }


  initForm() {
    this.formGroupDeposit = this.formBuilder.group(
      {
        recipientAccountNumber: ['', [Validators.required, Validators.pattern('^[0-9]*$'), Validators.minLength(10)]],
        effectiveAmount: [0],
        numberCheck: [0, [Validators.required, Validators.min(0), Validators.max(999), Validators.maxLength(3), Validators.pattern('^[0-9]*$')]],
        amountCheck: [0, [Validators.required]],
        fundsSource: [''],
        fundsDestination: [''],
        slideToggleDepositor: [true],
        depositorName: ['', [Validators.required]],
        depositorDNI: ['', [Validators.required]],
        depositorPhone: ['', [Validators.required, Validators.minLength(10), Validators.pattern('09+[0-9]{8}')]],
        depositorEmail: ['', [Validators.required, Validators.pattern('[A-Za-z0-9._%-]+@[A-Za-z0-9._%-]+\\.[a-z]{2,3}')]]
      });


    if (!this.deviceService.isDesktop()) {
      this.formGroupDeposit.controls.depositorPhone.setValidators(null);
      this.formGroupDeposit.controls.depositorEmail.setValidators(null);
    } else {
      this.formGroupDeposit.controls.depositorPhone.setValidators([Validators.required, Validators.minLength(10), Validators.pattern('09+[0-9]{8}')]);
      this.formGroupDeposit.controls.depositorEmail.setValidators([Validators.required, Validators.pattern('[A-Za-z0-9._%-]+@[A-Za-z0-9._%-]+\\.[a-z]{2,3}')])
    }

    if (localStorage.getItem(this.emonicLocalStorageDataTemp) !== null) {
      this.loadDataLocalStorage();
    }
    this.checkNumberCheqs();
  }

  loadDataLocalStorage() {

    const temp = JSON.parse(localStorage.getItem(this.emonicLocalStorageDataTemp));

    if (temp.accountNumber) {
      this.formGroupDeposit.controls.recipientAccountNumber.setValue(temp.accountNumber);
      this.getAccountInfo();
    }
    if (temp.amountCash) {
      this.formGroupDeposit.controls.effectiveAmount.setValue(temp.amountCash);
    }
    if (temp.nCheck) {
      this.formGroupDeposit.controls.numberCheck.setValue(temp.nCheck);
    }
    if (temp.amountCheck) {
      this.formGroupDeposit.controls.amountCheck.setValue(temp.amountCheck);
    }
    if (temp.fundsSource) {
      this.formGroupDeposit.controls.fundsSource.setValue(temp.fundsSource);
    }
    if (temp.fundsDestination) {
      this.formGroupDeposit.controls.fundsDestination.setValue(temp.fundsDestination);
    }

    if (!temp.own) {
      this.formGroupDeposit.controls.slideToggleDepositor.setValue(temp.own);
      this.imNotDepositor(temp.client);
    }


    if (temp.client.phone) {
      this.formGroupDeposit.controls.depositorPhone.setValue(temp.client.phone);
    }

    if (temp.client.email) {
      this.formGroupDeposit.controls.depositorEmail.setValue(temp.client.email);
    }



    if (temp.sign !== '') {
      this.signature = temp.sign;
      this.isSignEmptyerror = false;
      this.isSignEmpty = false;
    }

    this.total = this.getTotalGlobal();
    localStorage.removeItem('datosDeposit');
  }

  validadorDeCedula(cedula: string) {
    let cedulaCorrecta = false;
    if (cedula.length === 10)
    {
      const tercerDigito = parseInt(cedula.substring(2, 3), 0);
      if (tercerDigito < 6) {
        const coefValCedula = [2, 1, 2, 1, 2, 1, 2, 1, 2];
        const verificador = parseInt(cedula.substring(9, 10), 0);
        let suma = 0;
        let digito = 0;
        for (let i = 0; i < (cedula.length - 1); i++) {
          digito = parseInt(cedula.substring(i, i + 1), 0) * coefValCedula[i];
          suma += ((parseInt((digito % 10)+'', 0) + (parseInt((digito / 10)+'', 0))));
        }
        suma= Math.round(suma);
        if ((Math.round(suma % 10) === 0) && (Math.round(suma % 10) === verificador)) {
          cedulaCorrecta = true;
        } else if ((10 - (Math.round(suma % 10))) === verificador) {
          cedulaCorrecta = true;
        } else {
          cedulaCorrecta = false;
        }
      } else {
        cedulaCorrecta = false;
      }
    } else {
      cedulaCorrecta = false;
    }
    return cedulaCorrecta;
  }

  dniCheck() {
    this.formGroupDeposit.controls.depositorDNI.markAsTouched();
    if(this.formGroupDeposit.controls.depositorDNI.valid){
      if(this.formGroupDeposit.controls.depositorDNI.value.length === 10){
        if(this.noDNI.includes(String(this.formGroupDeposit.controls.depositorDNI.value))) {
          this.formGroupDeposit.controls.depositorDNI.setErrors({
            serverError: 'Ingrese una numero de cedula valido '
          });
        } else {
          if(this.validadorDeCedula(this.formGroupDeposit.controls.depositorDNI.value)){
            this.formGroupDeposit.controls.depositorDNI.setErrors({
              serverError: null
            });
            this.formGroupDeposit.controls.depositorDNI.updateValueAndValidity();
          } else {
            this.formGroupDeposit.controls.depositorDNI.setErrors({
              serverError: 'Ingrese una numero de cedula valido '
            });
          }
        }
      }else{
        this.formGroupDeposit.controls.depositorDNI.setErrors({
          serverError: null
        });

        this.formGroupDeposit.controls.depositorDNI.updateValueAndValidity();
      }
    }

  }

  get formValues() { return this.formGroupDeposit.controls; }

  deleteAccountNumber() {
    this.formGroupDeposit.controls.recipientAccountNumber.setValue('');
  }

  numberOnly($event: KeyboardEvent) {
    if ($event.keyCode <= 45 || $event.keyCode > 57 || $event.keyCode == 47 || $event.keyCode == 46) {
      return false;
    }
    return true;
  }

  backSpace(event){
    this.total = this.getTotalGlobal();
    return true;
  }

  numberOnlyAmountCash($event: KeyboardEvent) {
    this.total = this.getTotalGlobal();
    this.checkAmount();
    return this.numberOnly($event);
  }

  numberOnlyChecks($event: KeyboardEvent) {
    if (this.formGroupDeposit.controls.numberCheck.value < 0) {
      this.formGroupDeposit.controls.numberCheck.setValue(0);
      return false;
    }
    this.checkNumberCheqs();
    return this.numberOnly($event);
  }

  numberOnlyAmountChecks($event: KeyboardEvent) {
    this.checkNumberCheqs();
    this.total = this.getTotalGlobal();
    this.checkAmount();
    return this.numberOnly($event);
  }

  getTotalGlobal() {
    return this.total = Number((this.formGroupDeposit.controls.effectiveAmount.value + this.formGroupDeposit.controls.amountCheck.value).toFixed(2));
  }



  getAccountInfo() {
    if (this.formGroupDeposit.controls.recipientAccountNumber.valid) {
      this.queryIntents++;
      console.log("Contador1: ", this.queryIntents);
      console.log("Contador2: ", this.queryIntentsConfig);
      if (this.queryIntents <= this.queryIntentsConfig) {
        this.cajaVerdeService.getInfoAccount(this.formGroupDeposit.controls.recipientAccountNumber.value).subscribe(
          next => {
            switch (next.errorCode) {
              case '0': {
                this.accountInfo = next.account;
                this.accountInfoLoad = true;
                if ( next.account.accountOwnerDNI.length > 10 ) {
                  this.formGroupDeposit.controls.slideToggleDepositor.setValue(false);
                  this.formGroupDeposit.controls.slideToggleDepositor.disable();
                }else{
                  this.formGroupDeposit.controls.slideToggleDepositor.enable();
                }

                if (this.formGroupDeposit.controls.slideToggleDepositor.value) {
                  this.formGroupDeposit.controls.depositorName.setValue(next.account.accountName);
                  this.formGroupDeposit.controls.depositorDNI.setValue(next.account.accountOwnerDNI);

                  this.formGroupDeposit.controls.depositorName.disable();;
                  this.formGroupDeposit.controls.depositorDNI.disable();
                }
                break;
              }
              case '-1': {
                this.AcountNotFound = true;
                this.formGroupDeposit.controls.recipientAccountNumber.setErrors({ serverError: next.userMessage });
                this.matDialog.open(TransactionsAlertComponent, { data: { message: next.userMessage, action: '' } });
                break;
              }
              case '9999': {
                this.AcountNotFound = true;
                this.formGroupDeposit.controls.recipientAccountNumber.setErrors({ serverError: next.userMessage });
                break;
              }
              default: {
                this.router.navigateByUrl('/oops');
                break;
              }
            }
            this.changeDetectorRef.detectChanges();
          },
          error => {
            this.router.navigateByUrl('/oops');
          }
        );
      } else {
        this.matDialog.open(TransactionsAlertComponent, { data: { message: 'Haz alcanzado tu límite de intentos por depósito.', action: 'goToHome' } });
      }
    }
  }

  otherAccount() {
    this.deleteAccountNumber();
    this.accountInfoLoad = false;
  }

  removeOneCheck() {
    if (this.formGroupDeposit.controls.numberCheck.value > 0) {
      this.formGroupDeposit.controls.numberCheck.setValue(Number(this.formGroupDeposit.controls.numberCheck.value) - 1);
    } else {
      this.formGroupDeposit.controls.numberCheck.setValue(0);
      this.formGroupDeposit.controls.amountCheck.setValue(0);
    }
    this.checkNumberCheqs();
  }

  addOneCheck() {
    this.formGroupDeposit.controls.numberCheck.setValue(Number(this.formGroupDeposit.controls.numberCheck.value) + 1);
    this.checkNumberCheqs();
  }

  imDepositor() {
    if (!this.formGroupDeposit.controls.slideToggleDepositor.value) {
      if (this.accountInfoLoad) {
        this.formGroupDeposit.controls.depositorName.setValue(this.accountInfo.accountName);
        this.formGroupDeposit.controls.depositorDNI.setValue(this.accountInfo.accountOwnerDNI);
      }
      this.formGroupDeposit.controls.depositorName.disable();
      this.formGroupDeposit.controls.depositorDNI.disable();
    } else {
      this.formGroupDeposit.controls.depositorName.setValue('');
      this.formGroupDeposit.controls.depositorDNI.setValue('');

      this.formGroupDeposit.controls.depositorName.enable();
      this.formGroupDeposit.controls.depositorDNI.enable();
    }
  }

  imNotDepositor(client: ClientModel) {
    this.formGroupDeposit.controls.depositorDNI.setValue(client.identification);
    this.formGroupDeposit.controls.depositorName.setValue(client.name);

    this.formGroupDeposit.controls.depositorName.enable();;
    this.formGroupDeposit.controls.depositorDNI.enable();
  }

  onNumber(value: string): number {
    return Number(value);
  }

  checkAmount() {
    if (Number(this.getTotalGlobal()) >= this.config.legalInformation) {
      this.formGroupDeposit.controls.fundsSource.setValidators([Validators.required]);
      this.formGroupDeposit.controls.fundsDestination.setValidators([Validators.required]);
    } else {
      this.formGroupDeposit.controls.fundsSource.setValidators(null);
      this.formGroupDeposit.controls.fundsDestination.setValidators(null);
      this.total = Number(this.getTotalGlobal());
    }
  }


  goToSignature() {
    localStorage.setItem(this.emonicLocalStorageDataTemp, JSON.stringify(this.getDepositData(true)));
    this.router.navigateByUrl('/firma');
  }

  checkNumberCheqs() {
    if (this.formGroupDeposit.controls.numberCheck.value > 0) {
      this.formGroupDeposit.controls.amountCheck.setValidators([Validators.required, Validators.min(1)]);
      this.formGroupDeposit.controls.effectiveAmount.setValidators(null);
    } else {
      this.formGroupDeposit.controls.amountCheck.setValue(0);
      this.formGroupDeposit.controls.effectiveAmount.setValidators([Validators.required]);
      this.formGroupDeposit.controls.amountCheck.setValidators(null);
      this.formGroupDeposit.controls.amountCheck.updateValueAndValidity();
      this.total = this.getTotalGlobal();
    }
  }

  deleteLocaStorage() {
    localStorage.removeItem(this.emonicLocalStorageDataTemp);
  }

  save() {
    const controls = this.formGroupDeposit.controls;

    if (this.formGroupDeposit.invalid) {
      Object.keys(controls).forEach(controlName =>
        controls[controlName].markAsTouched()
      );
      this.matDialog.open(TransactionsAlertComponent, { data: { message: 'Debe completar todo el formulario', action: '' } });
      return;
    }

    if (this.getTotalGlobal() > 0) {


      if (Number(this.formGroupDeposit.controls.effectiveAmount.value) > this.config.maxAmmount) {
        this.matDialog.open(TransactionsAlertComponent, { data: { message: 'El monto en efectivo excede el límite permitido para transacciones en caja verde.', action: '' } });
        return;
      }

      if(Number(this.formGroupDeposit.controls.amountCheck.value) > 10000000.00){
        this.matDialog.open(TransactionsAlertComponent, { data: { message: 'El monto en cheque excede el límite permitido para transacciones en caja verde.', action: '' } });
        return;
      }

      if (this.formGroupDeposit.valid) {
        if (this.signature === '') {
          this.matDialog.open(TransactionsAlertComponent, { data: { message: 'Ingrese su firma digital', action: '' } });
          this.isSignEmptyerror = true;
          return false;
        }

        this.unsend = true;

        this.isSignEmptyerror = false;

        const transaction = new RequestTransactionDepositModel();
        transaction.typeNemonic = 'DP';
        transaction.accessType = (this.isDesktop$) ? 'W' : 'M';
        transaction.session = this.getSessionData();
        transaction.deposit = this.getDepositData();
        transaction.deposit.client = this.getClientData();
        transaction.depositor = this.getDepositorInfo();
        this.store.dispatch(new SaveTransactionsDeposit({ transaction }));
      }
    } else {
    }
  }

  getDepositData(a?: boolean): DepositModel {
    const deposit = new DepositModel();

    if (this.accountInfoLoad) {
      deposit.accountNumber = this.accountInfo.accountNumber;
      deposit.accountTypeCode = this.accountInfo.accountTypeCode;
    }

    deposit.amountCash = this.formGroupDeposit.controls.effectiveAmount.value;
    deposit.amountCheck = this.formGroupDeposit.controls.amountCheck.value;
    deposit.nCheck = this.formGroupDeposit.controls.numberCheck.value;
    deposit.fundsSource = this.formGroupDeposit.controls.fundsSource.value;
    deposit.fundsDestination = this.formGroupDeposit.controls.fundsDestination.value
    deposit.sign = this.signature;
    deposit.own = this.formGroupDeposit.controls.slideToggleDepositor.value;

    if (a) {
      const client = new ClientModel();
      client.identification = this.formGroupDeposit.controls.depositorDNI.value;
      client.name = this.formGroupDeposit.controls.depositorName.value;
      client.email = this.formGroupDeposit.controls.depositorEmail.value;
      client.phone = this.formGroupDeposit.controls.depositorPhone.value;
      deposit.client = client;
    }
    return deposit;
  }

  getSessionData(): SessionModel {
    const session = new SessionModel();
    session.sessionId = this.sessionID;
    session.deviceId = Number(localStorage.getItem(environment.varLocalStorageDevice));
    return session;
  }

  getClientData(): ClientModel {
    const client = new ClientModel();
    client.name = this.accountInfo.accountName;
    client.identification = this.accountInfo.accountOwnerDNI;
    return client;
  }

  getDepositorInfo(): DepositorModel {
    const depositor = new DepositorModel();
    depositor.identification = this.formGroupDeposit.controls.depositorDNI.value;
    depositor.name = this.formGroupDeposit.controls.depositorName.value;
    depositor.mail = this.formGroupDeposit.controls.depositorEmail.value;
    depositor.phone = this.formGroupDeposit.controls.depositorPhone.value;
    return depositor;
  }

  isControlHasError(controlName: string, validationType: string): boolean {
    const control = this.formGroupDeposit.controls[controlName];
    if (!control) {
      return false;
    }
    const result = control.hasError(validationType) && (control.dirty || control.touched);
    return result;
  }

}
