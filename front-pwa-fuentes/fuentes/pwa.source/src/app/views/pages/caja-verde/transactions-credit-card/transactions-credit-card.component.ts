import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CajaVerdeComponent } from '../caja-verde.component';
import {TransactionsAlertComponent} from '../transactions-alert/transactions-alert.component';
import {MatDialog} from '@angular/material/dialog';
import {CajaVerdeService} from '../../../../core/caja-verde/_services/caja-verde.service';
import {CredicardModel} from '../../../../core/caja-verde/_models/credicard.model';
import {CredicardsListComponent} from './credicards-list/credicards-list.component';
import {ClientModel} from '../../../../core/caja-verde/_models/client.model';
import {select, Store} from '@ngrx/store';
import {config, isDesktop, sessionID} from '../../../../core/caja-verde/_selectors/caja-verde.selectors';
import {AppState} from '../../../../core/reducers';
import {ConfigModel} from '../../../../core/caja-verde/_models/config.model';
import {animate, style, transition, trigger} from '@angular/animations';
import {RequestTransactionDepositModel} from '../../../../core/caja-verde/_models/_request-transaction-deposit.model';
import {SaveTransactionsDeposit} from '../../../../core/caja-verde/_actions/caja-verde.actions';
import {RequestTransactionPaycardModel} from '../../../../core/caja-verde/_models/_request-transaction-paycard.model';
import {Observable} from 'rxjs';
import {SessionModel} from '../../../../core/caja-verde/_models/session.model';
import {environment} from '../../../../../environments/environment';
import {DepositorModel} from '../../../../core/caja-verde/_models/depositor.model';
import {DepositModel} from '../../../../core/caja-verde/_models/deposit.model';
import {PaycardModel} from '../../../../core/caja-verde/_models/paycard.model';
import {DeviceDetectorService} from 'ngx-device-detector';

@Component({
  selector: 'app-transactions-credit-card',
  templateUrl: './transactions-credit-card.component.html',
  styles: [],
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
export class TransactionsCreditCardComponent implements OnInit {
  public formGroupCreditCard: FormGroup;
  queryIntents = 0;
  unsend = false;
  queryIntentsConfig = 3;
  dniInvalidate = false;
    /*
   * Comprobar si la info es correcta.
   */

    public isCorrectInformation = true;

  /*
   * Muestra panel legal de información.
   */

  public showPanelLegalInformation = false;

  /*
   * Muestra panel detalle de cheques.
   */

  public showPanelDetailChecks = false;

  /*
   * Muestra card de resumen de titular.
   */

  public showCardTitularDataCreditCard = false;
  public showPanelNoChecksNoLimitDolars = false;
  public formGroupInit: FormGroup;
  public formGroupInitErrors: any = {
    holderId: '',
    effectiveAmount: '',
    amountCheck: '',
  };

  private credicards: CredicardModel[];
  credicardsLoad: boolean;
  credicard: CredicardModel;
  creditCardLoad: boolean;
  client: ClientModel;
  total = 0;
  config: ConfigModel;

  isDesktop$: Observable<boolean>;

  sessionID: number;

  constructor(
    private formBuilder: FormBuilder,
    public father: CajaVerdeComponent,
    private cajaVerdeService: CajaVerdeService,
    public matDialog: MatDialog,
    private store: Store<AppState>,
    private deviceService: DeviceDetectorService
  ) {}

  public ngOnInit(): void {
    this.store.pipe(select(config)).subscribe(
      next => {
        this.config = next;
      }
    );
    this.isDesktop$ = this.store.pipe(select(isDesktop));
    this.CreateInitForm();
    this.initForm();

    this.store.pipe(select(sessionID)).subscribe(
      next=> {
        this.sessionID = next;
      }
    );
  }

  initForm(){
    this.formGroupCreditCard = this.formBuilder.group(
      {
        holderId: ['', [Validators.required, Validators.pattern('^[0-9]*$'), Validators.minLength(10)]],
        effectiveAmount: [0, [Validators.required]],
        numberCheck: [0, [Validators.required, Validators.min(0), Validators.max(999), Validators.maxLength(3)]],
        amountCheck: [0, [Validators.required]],
        amountCheckOthers: [0, [Validators.required]],
        amountCheckInternational: [0, [Validators.required]],
        amountCheckInternationalMiami: [0, [Validators.required]],
        amountCheckInternationalNY: [0, [Validators.required]],
        amountCheckInternationalOther: [0, [Validators.required]],
        fundsSource: [''],
        fundsDestination: [''],
        slideToggleDepositor: [true],
        depositorName: ['', [Validators.required]],
        depositorDNI: ['', [Validators.required]],
        depositorPhone: ['', [Validators.required, Validators.minLength(10), Validators.pattern('09+[0-9]{8}')]],
        depositorEmail: ['', [Validators.required, Validators.pattern('[A-Za-z0-9._%-]+@[A-Za-z0-9._%-]+\\.[a-z]{2,3}')]]
      });


    if(!this.deviceService.isDesktop()){
      this.formGroupCreditCard.controls.depositorPhone.setValidators(null);
      this.formGroupCreditCard.controls.depositorEmail.setValidators(null);
    } else {
      this.formGroupCreditCard.controls.depositorPhone.setValidators([Validators.required, Validators.minLength(10), Validators.pattern('09+[0-9]{8}')]);
      this.formGroupCreditCard.controls.depositorEmail.setValidators([Validators.required, Validators.pattern('[A-Za-z0-9._%-]+@[A-Za-z0-9._%-]+\\.[a-z]{2,3}')]);
    }
  }

  backSpace(event){
    this.total = this.getTotal();
    this.checkTotal();
    return true;
  }
  /*
   *
  Método privado permite crear el formulario inicial.
   */
  private CreateInitForm() {
    this.formGroupInit = this.formBuilder.group({
      holderId: [
        { value: '', disabled: false },
        [Validators.required, this.father.ValidIDFormControl],
      ],
      effectiveAmount: [{ value: '', disabled: false }, [Validators.required]],
      amountCheck: [{ value: '', disabled: false }, [Validators.required]],
    });
  }

  /*
   *
  Método público que permite mostrar los campos que faltan para la completar la transacción correspondiente,
  Comprueba primero que los campos sean validos y luego muestro los campos restantes según la información enviada
  mostrar popup de tarjetas correspondiente al titular en caso de tener varias tarjetas si es solo 1 continua
  en caso de ser un monto mayor a 5000 mostrar información legal
  en caso de tener cheques mostrar los campos correspondientes al detalle de los valores de los mismos
  y mostrar los datos correspondiente al titular.

   */


  save() {
    this.checkTotal();
    const controls = this.formGroupCreditCard.controls;

    if (this.formGroupCreditCard.invalid) {
      Object.keys(controls).forEach(controlName =>
        controls[controlName].markAsTouched()
      );
      this.matDialog.open(TransactionsAlertComponent, {data: {message: 'Debe completar todo el formulario', action: ''}});
      return;
    }

    if(!this.valueCheque()){

      this.formGroupCreditCard.controls.amountCheck.setValidators([Validators.required]);
      this.formGroupCreditCard.controls.amountCheckOthers.setValidators([Validators.required]);
      this.formGroupCreditCard.controls.amountCheckInternational.setValidators([Validators.required]);
      this.matDialog.open(TransactionsAlertComponent, {data: {message: 'Ha indicado un numero de cheque, indique un monto en la(s) categoría(s) que corresponda(n)', action: ''}});
      return;
    }

    if(!this.valueNCheque()){

      this.matDialog.open(TransactionsAlertComponent, {data: {message: 'Ha indicado un numero de cheque menor a los que ha especificado', action: ''}});
      return;
    }

    if(this.total<1){
      if(this.formGroupCreditCard.controls.amountCheck.value>0){
        this.formGroupCreditCard.controls.effectiveAmount.setValidators(null);
      }else{
        this.formGroupCreditCard.controls.effectiveAmount.setValidators([Validators.required]);
      }
      if( this.formGroupCreditCard.controls.numberCheck.value > 0 ){
        this.matDialog.open(TransactionsAlertComponent, {data: {message: 'Por favor especifique un monto para su pago', action: ''}});
        return;
      }
    }

    if(Number(this.formGroupCreditCard.controls.effectiveAmount.value) >this.config.maxAmmount){
      this.matDialog.open(TransactionsAlertComponent, {data: {message: 'El monto en efectivo excede el límite permitido para transacciones en caja verde.', action: ''}});
      return;
    }

    if (Number(this.formGroupCreditCard.controls.amountCheck.value > 10000000.00)){
      this.matDialog.open(TransactionsAlertComponent, { data: { message: 'El monto en cheque excede el límite permitido para transacciones en caja verde.', action: '' } });
      return;
    }

    if (Number(this.formGroupCreditCard.controls.amountCheckOthers.value > 10000000.00)){
      this.matDialog.open(TransactionsAlertComponent, { data: { message: 'El monto en cheque excede el límite permitido para transacciones en caja verde.', action: '' } });
      return;
    }
/*     if (Number(this.formGroupCreditCard.controls.amountCheckInternational.value > 10000000.00)){
      this.matDialog.open(TransactionsAlertComponent, { data: { message: 'El monto en cheque excede el límite permitido para transacciones en caja verde.', action: '' } });
      return;
    } */
    if (Number(this.formGroupCreditCard.controls.amountCheckInternationalMiami.value > 10000000.00)){
      this.matDialog.open(TransactionsAlertComponent, { data: { message: 'El monto en cheque excede el límite permitido para transacciones en caja verde.', action: '' } });
      return;
    }
    if (Number(this.formGroupCreditCard.controls.amountCheckInternationalNY.value > 10000000.00)){
      this.matDialog.open(TransactionsAlertComponent, { data: { message: 'El monto en cheque excede el límite permitido para transacciones en caja verde.', action: '' } });
      return;
    }
    if (Number(this.formGroupCreditCard.controls.amountCheckInternationalOther.value > 10000000.00)){
      this.matDialog.open(TransactionsAlertComponent, { data: { message: 'El monto en cheque excede el límite permitido para transacciones en caja verde.', action: '' } });
      return;
    }

    if(!this.creditCardLoad){
      return false;
    }

        this.unsend = true;


        const transaction = new RequestTransactionPaycardModel();
        transaction.typeNemonic = 'TC';
        transaction.accessType = (this.isDesktop$)?'W':'M';
        transaction.session = this.getSessionData();
        transaction.payCard = this.getDepositData();
        transaction.payCard.client = this.getClientData();
        transaction.depositor = this.getDepositorInfo();
        this.store.dispatch(new SaveTransactionsDeposit({transaction}));

  }

  getDepositData(): PaycardModel {
    const payCard = new PaycardModel();

    if(this.creditCardLoad){
      payCard.cardNumber = this.credicard.cardNumber;
      payCard.cardKey = this.credicard.cardKey;
      payCard.cardType = this.credicard.cardType;
      payCard.cardBrand = this.credicard.cardBrand;
    }

    payCard.amountCash = this.formGroupCreditCard.controls.effectiveAmount.value;


    payCard.nCheck = this.formGroupCreditCard.controls.numberCheck.value;

    payCard.amountCheckBb = this.formGroupCreditCard.controls.amountCheck.value;
    payCard.amountCheckOb = this.formGroupCreditCard.controls.amountCheckOthers.value;
    payCard.amountTotalCheckEx = this.formGroupCreditCard.controls.amountCheckInternational.value;
    payCard.amountCheckMi = this.formGroupCreditCard.controls.amountCheckInternationalMiami.value;
    payCard.amountCheckNy = this.formGroupCreditCard.controls.amountCheckInternationalNY.value;
    payCard.amountCheckOp = this.formGroupCreditCard.controls.amountCheckInternationalOther.value;
    payCard.totalAmount = this.getTotal();

    payCard.fundsSource = this.formGroupCreditCard.controls.fundsSource.value;
    payCard.fundsDestination = this.formGroupCreditCard.controls.fundsDestination.value

    return  payCard;
  }

  getTotal() {
    return (
      this.formGroupCreditCard.controls.effectiveAmount.value +
      this.formGroupCreditCard.controls.amountCheck.value +
      this.formGroupCreditCard.controls.amountCheckOthers.value +
      this.formGroupCreditCard.controls.amountCheckInternational.value
    ).toFixed(2);
  }

  getSessionData(): SessionModel {
    const session = new SessionModel();
    session.sessionId = this.sessionID;
    session.deviceId = Number(localStorage.getItem(environment.varLocalStorageDevice));
    return session;
  }

  getClientData(): ClientModel {
    const client = new ClientModel();
    client.identification = this.client.identification;
    client.name = this.client.name;
    return client;
  }

  getDepositorInfo():DepositorModel{
    const depositor = new DepositorModel();
    depositor.identification = this.formGroupCreditCard.controls.depositorDNI.value;
    depositor.name = this.formGroupCreditCard.controls.depositorName.value;
    depositor.mail = this.formGroupCreditCard.controls.depositorEmail.value;
    depositor.phone = this.formGroupCreditCard.controls.depositorPhone.value;
    return depositor;
  }

  get formValues() { return this.formGroupCreditCard.controls; }

  numberOnly($event: KeyboardEvent) {
    this.total = this.getTotal();
    if ($event.keyCode < 45 || $event.keyCode > 57) {
      return false;
    }
    return true;
  }
  numberOnlyC($event: KeyboardEvent) {
    if(this.formGroupCreditCard.controls.numberCheck.value<0){
      this.formGroupCreditCard.controls.numberCheck.setValue(0);
      return false;
    }
    if ($event.keyCode <= 45 || $event.keyCode > 57 || $event.keyCode == 47 || $event.keyCode == 46) {
      return false;
    }
    this.total = this.getTotal();
    return true;
  }

  getCredicards() {
    if (this.formGroupCreditCard.controls.holderId.valid) {
      this.queryIntents++;
      if(this.queryIntents <= this.queryIntentsConfig){
        this.cajaVerdeService.getCreditCards({
          client: {
            identification: this.formGroupCreditCard.controls.holderId.value
          }
        }).subscribe(
            next => {
              switch(next.errorCode) {
                case '0': {
                  if(next.creditCards.length === 0){
                    this.matDialog.open(TransactionsAlertComponent, {data: {message: 'Oops! No se encontraron tarjetas asociadas a este numero de cedula, intente de nuevo, recuerde que tiene ' + this.queryIntents + '/' + this.queryIntentsConfig + ' intentos disponibles', action: ''}});
                  } else {
                    this.client = next.client;
                    if(next.client.name){
                      this.formGroupCreditCard.controls.depositorName.setValue(next.client.name);
                    }
                    if(next.client.identification){
                      this.formGroupCreditCard.controls.depositorDNI.setValue(next.client.identification);
                    }
                    if(next.creditCards.length > 1){
                      this.imDepositor(true);
                      const dialogRef = this.matDialog.open(CredicardsListComponent, {
                        autoFocus: false,
                        maxHeight: '90vh',
                        data: {
                          tdcs: next.creditCards
                        }});

                      dialogRef.afterClosed().subscribe(result => {
                        if(result){
                          this.credicard = result;
                          this.creditCardLoad = true;
                        } else{
                          this.formGroupCreditCard.controls.holderId.setValue('');
                        }
                      });
                    } else {
                      this.credicard = next.creditCards[0];
                      this.creditCardLoad = true;
                    }
                  }
                  break;
                }
                default: {
                  break;
                }
              }
            }
        );

      }else{
        this.matDialog.open(TransactionsAlertComponent, {data: {message: 'Haz alcanzado tu límite de intentos por pago de tarjeta.', action: 'goToHome'}});
      }
    }
  }

  otherCard() {
    this.deleteCreditCardNumber();
    this.credicard = new CredicardModel();
    this.creditCardLoad = false;
  }

  deleteCreditCardNumber() {
    this.formGroupCreditCard.controls.holderId.setValue('');
  }

  removeOneCheck() {

    if(this.formGroupCreditCard.controls.numberCheck.value > 0){
      this.formGroupCreditCard.controls.numberCheck.setValue( Number(this.formGroupCreditCard.controls.numberCheck.value) - 1 );
    } else {
      this.formGroupCreditCard.controls.numberCheck.setValue(0);
      this.formGroupCreditCard.controls.amountCheck.setValue(0);
    }
    this.checkNumberCheqs();
  }

  addOneCheck() {
    this.checkNumberCheqs();
    this.formGroupCreditCard.controls.numberCheck.setValue( Number(this.formGroupCreditCard.controls.numberCheck.value) + 1 );
  }

  imDepositor(set?: boolean) {
    if(!this.formGroupCreditCard.controls.slideToggleDepositor.value || set){
      if(set){
        this.formGroupCreditCard.controls.slideToggleDepositor.setValue(true);
      }
      this.formGroupCreditCard.controls.depositorName.setValue(this.client.name);
      this.formGroupCreditCard.controls.depositorDNI.setValue(this.client.identification);

      this.formGroupCreditCard.controls.depositorName.disable();;
      this.formGroupCreditCard.controls.depositorDNI.disable();
    } else {
      this.formGroupCreditCard.controls.depositorName.setValue('');
      this.formGroupCreditCard.controls.depositorDNI.setValue('');


      this.formGroupCreditCard.controls.depositorName.enable();;
      this.formGroupCreditCard.controls.depositorDNI.enable();
    }
  }

  onNumber(value: string): number {
    return Number(value);
  }



  checkAmount() {

    this.setTotal();
    this.total = this.getTotal();
    if(Number(this.formGroupCreditCard.controls.effectiveAmount.value) >= this.config.legalInformation){
      this.formGroupCreditCard.controls.fundsSource.setValidators([Validators.required]);
      this.formGroupCreditCard.controls.fundsDestination.setValidators([Validators.required]);
    }else{
      this.formGroupCreditCard.controls.fundsSource.setValidators(null);
      this.formGroupCreditCard.controls.fundsDestination.setValidators(null);
    }
  }

  setTotal(){
    this.total = (this.formGroupCreditCard.controls.effectiveAmount.value + this.formGroupCreditCard.controls.amountCheck.value).toFixed(2);  
  }

  checkNumberCheqs() {
    if(this.formGroupCreditCard.controls.numberCheck.value > 0){
        this.formGroupCreditCard.controls.amountCheck.setValidators([Validators.required]);
        this.formGroupCreditCard.controls.amountCheckOthers.setValidators([Validators.required]);
        this.formGroupCreditCard.controls.amountCheckInternational.setValidators([Validators.required]);
        this.formGroupCreditCard.controls.amountCheck.setValue(0);
        this.formGroupCreditCard.controls.amountCheckOthers.setValue(0);
        this.formGroupCreditCard.controls.amountCheckInternational.setValue(0);
      } else {
        this.formGroupCreditCard.controls.amountCheck.setValue(0);
        this.formGroupCreditCard.controls.amountCheckOthers.setValue(0);
        this.formGroupCreditCard.controls.amountCheckInternational.setValue(0);
        this.formGroupCreditCard.controls.amountCheck.setValidators(null);
        this.formGroupCreditCard.controls.amountCheckOthers.setValidators(null);
        this.formGroupCreditCard.controls.amountCheckInternational.setValidators(null);
        this.formGroupCreditCard.controls.amountCheck.updateValueAndValidity();
        this.formGroupCreditCard.controls.amountCheckOthers.updateValueAndValidity();
        this.formGroupCreditCard.controls.amountCheckInternational.updateValueAndValidity();
        this.total = this.getTotal();
    }
  }

  checkInputCheqs(){
    if(this.formGroupCreditCard.controls.numberCheck.value ){

    }
  }

  valueCheque(){
    if(this.formGroupCreditCard.controls.numberCheck.value > 0){
      if(this.formGroupCreditCard.controls.amountCheck.value>0){
        return true;
      }
      if(this.formGroupCreditCard.controls.amountCheckOthers.value>0){
        return true;
      }
      if(this.formGroupCreditCard.controls.amountCheckInternational.value>0){
        return true;
      }
      return false;
    }else{
      return true;
    }
  }


  valueNCheque(){
    const tem = this.formGroupCreditCard.controls.numberCheck.value;
    let temN = 0;
    if(tem > 0){
      if(this.formGroupCreditCard.controls.amountCheck.value>0){
        temN++;
      }
      if(this.formGroupCreditCard.controls.amountCheckOthers.value>0){
        temN++;
      }
      if(this.formGroupCreditCard.controls.amountCheckInternational.value>0){
        if(this.formGroupCreditCard.controls.amountCheckInternationalMiami.value>0){
          temN++;
        }
        if(this.formGroupCreditCard.controls.amountCheckInternationalNY.value>0){
          temN++;
        }
        if(this.formGroupCreditCard.controls.amountCheckInternationalOther.value>0){
          temN++;
        }
      }

      if(temN<=tem){
        return true;
      }
      return false;
    }else{
      return true;
    }
  }

  checkTotal() {
    this.total = this.getTotal();
    const total1 = (this.formGroupCreditCard.controls.amountCheckInternationalMiami.value +
      this.formGroupCreditCard.controls.amountCheckInternationalNY.value +
      this.formGroupCreditCard.controls.amountCheckInternationalOther.value);

      if (Number(this.formGroupCreditCard.controls.amountCheckInternational.value) > 0){
        if( total1 !== Number(this.formGroupCreditCard.controls.amountCheckInternational.value)){

          this.formGroupCreditCard.controls.amountCheckInternational.setErrors({
            serverError: 'El monto de las sumas de los diferentes cheques es diferente al especificado'
          });
    
          this.formGroupCreditCard.controls.amountCheckInternationalMiami.setErrors({
            serverError: 'El monto de las sumas de los diferentes cheques es diferente al especificado'
          });
    
          this.formGroupCreditCard.controls.amountCheckInternationalNY.setErrors({
            serverError: 'El monto de las sumas de los diferentes cheques es diferente al especificado'
          });
    
          this.formGroupCreditCard.controls.amountCheckInternationalOther.setErrors({
            serverError: 'El monto de las sumas de los diferentes cheques es diferente al especificado'
          });
        } else {
          this.formGroupCreditCard.controls.amountCheckInternational.setErrors({
            serverError: null
          });
          this.formGroupCreditCard.controls.amountCheckInternational.updateValueAndValidity();
    
          this.formGroupCreditCard.controls.amountCheckInternationalMiami.setErrors({
            serverError: null
          });
          this.formGroupCreditCard.controls.amountCheckInternationalMiami.updateValueAndValidity();
    
          this.formGroupCreditCard.controls.amountCheckInternationalNY.setErrors({
            serverError: null
          });
          this.formGroupCreditCard.controls.amountCheckInternationalNY.updateValueAndValidity();
    
          this.formGroupCreditCard.controls.amountCheckInternationalOther.setErrors({
            serverError: null
          });
          this.formGroupCreditCard.controls.amountCheckInternationalOther.updateValueAndValidity();
        }
      } else {
        this.formGroupCreditCard.controls.amountCheckInternationalMiami.setValue(0);
        this.formGroupCreditCard.controls.amountCheckInternationalNY.setValue(0);
        this.formGroupCreditCard.controls.amountCheckInternationalOther.setValue(0);
      }
  }

  numberOnlyCheckInternational($event: KeyboardEvent) {
    const controlsSection = ['amountCheckInternational', 'amountCheckInternationalMiami', 'amountCheckInternationalNY', 'amountCheckInternationalOther'];
    const controls = this.formGroupCreditCard.controls;
    controlsSection.forEach(controlName =>
      controls[controlName].markAsTouched()
    );
    this.checkTotal();
    return this.numberOnly($event);
  }

  isControlHasError(controlName: string, validationType: string): boolean {
    const control = this.formGroupCreditCard.controls[controlName];
    if (!control) {
      return false;
    }
    const result = control.hasError(validationType) && (control.dirty || control.touched);
    return result;
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

}
