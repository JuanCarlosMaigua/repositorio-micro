import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ServicesModel} from '../../../../core/caja-verde/_models/services.model';
import {CajaVerdeService} from '../../../../core/caja-verde/_services/caja-verde.service';
import {Router} from '@angular/router';
import {CompanyModel} from '../../../../core/caja-verde/_models/company.model';
import {CompanyDetailModel} from '../../../../core/caja-verde/_models/company-detail.model';
import {RequestServiceModel} from '../../../../core/caja-verde/_models/_request-service.model';
import {ServiceModel} from '../../../../core/caja-verde/_models/service.model';
import {TransactionsAlertComponent} from '../transactions-alert/transactions-alert.component';
import {MatDialog} from '@angular/material/dialog';
import {ConfigModel} from '../../../../core/caja-verde/_models/config.model';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../../core/reducers';
import {config, isDesktop, sessionID} from '../../../../core/caja-verde/_selectors/caja-verde.selectors';
import {animate, style, transition, trigger} from '@angular/animations';
import {RequestTransactionDepositModel} from '../../../../core/caja-verde/_models/_request-transaction-deposit.model';
import {UtilsService} from '../../../../core/caja-verde/_services/utils.service';
import {SessionModel} from '../../../../core/caja-verde/_models/session.model';
import {environment} from '../../../../../environments/environment';
import {PayserviceModel} from '../../../../core/caja-verde/_models/payservice.model';
import {ClientModel} from '../../../../core/caja-verde/_models/client.model';
import {SaveTransactionsDeposit} from '../../../../core/caja-verde/_actions/caja-verde.actions';
import {DepositModel} from '../../../../core/caja-verde/_models/deposit.model';
import {DepositorModel} from '../../../../core/caja-verde/_models/depositor.model';
import {DeviceDetectorService} from 'ngx-device-detector';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-transactions-basic-services',
  templateUrl: './transactions-basic-services.component.html',
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
export class TransactionsBasicServicesComponent implements OnInit {
  public services: ServicesModel[];
  public service: ServicesModel;
  public servicesLoad = false;
  public serviceSelectedValue: string;
  public validateDNI: boolean;
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
  noRUC = [
    '1111111111111',
    '2222222222222',
    '3333333333333',
    '4444444444444',
    '5555555555555',
    '6666666666666',
    '7777777777777',
    '8888888888888',
    '9999999999999',
    '0000000000000',
  ];
  public companies: CompanyModel[];
  public company: CompanyModel;
  public companiesLoad = false;
  public companySelectedValue: string;

  public type: CompanyDetailModel;
  public region: CompanyDetailModel;
  public area: CompanyDetailModel;

  public searching = false;
  public serviceLoad = false;


  public showPanelLegalInformation = false;

  public showPanelDetailChecks = false;
  public total = 0;
  public config: ConfigModel;

  public basicService: ServiceModel;
  public sessionID: number;

  /*
   * Muestra panel de resumen de pago.
   */

  public showCardDataPay = false;

  /*
   * Comprobar si es servicio de luz.
   */

  public isServiceLight = false;

  /*
   * Comprobar si es servicio de teléfono.
   */

  public isServiceTelephone = false;

  /*
   * Comprobar si la info es correcta.
   */

  public isCorrectInformation = true;


  public formGroupBasicService: FormGroup;

  isDesktop$: Observable<boolean>;
  unsend = false;

  constructor(private cajaVerdeService: CajaVerdeService,
              private router: Router,
              public deviceService: DeviceDetectorService,
              public matDialog: MatDialog,
              private store: Store<AppState>,
              private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    this.isDesktop$ = this.store.pipe(select(isDesktop));
    this.initForm();
    this.getServices();
    this.store.pipe(select(config)).subscribe(
      next => {
        this.config = next;
      }
    );

    this.store.pipe(select(sessionID)).subscribe(
      next=> {
        this.sessionID = next;
      }
    );
  }

  getServices(){
    this.cajaVerdeService.getServices().subscribe(
      next=>{
        if(next.errorCode !== '0'){
          this.router.navigateByUrl('/oops');
        }else{
          this.services = next.service;
          this.servicesLoad = true;
        }
      },
      error => {
        this.router.navigateByUrl('/oops');
      }
    );
  }

  initForm(){
    this.formGroupBasicService = this.formBuilder.group(
      {
        dniHolder: ['', [Validators.required, Validators.pattern('^[0-9]*$'), Validators.minLength(10)]],
        service: [0, [Validators.required]],
        company: [0, [Validators.required]],
        serviceCode: ['', [Validators.required]],
        region: [0],
        area: [0],
        type: [0],
        effectiveAmount: [0, [Validators.required]],
        numberCheck: [0, [Validators.required, Validators.min(0), Validators.max(999), Validators.maxLength(3)]],
        amountCheck: [0, [Validators.required]],
        fundsSource: [''],
        fundsDestination: [''],
        slideToggleFactura: [true],
        receRuc: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
        receName: ['', [Validators.required]],
        depositorEmail: ['', [Validators.required, Validators.pattern('[A-Za-z0-9._%-]+@[A-Za-z0-9._%-]+\\.[a-z]{2,3}')]]
      }
    );
    if(!this.deviceService.isDesktop()){
      this.formGroupBasicService.controls.depositorEmail.setValidators(null);
    } else {
      this.formGroupBasicService.controls.depositorEmail.setValidators([Validators.required, Validators.pattern('[A-Za-z0-9._%-]+@[A-Za-z0-9._%-]+\\.[a-z]{2,3}')]);
    }
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
    this.formGroupBasicService.controls.dniHolder.markAsTouched();
    if(this.formGroupBasicService.controls.dniHolder.valid){
      if(this.formGroupBasicService.controls.dniHolder.value.length === 10){
        if(this.noDNI.includes(String(this.formGroupBasicService.controls.dniHolder.value))) {
          this.formGroupBasicService.controls.dniHolder.setErrors({
            serverError: 'Ingrese una numero de cedula valido '
          });
        } else {
          if(this.validadorDeCedula(this.formGroupBasicService.controls.dniHolder.value)){
            this.formGroupBasicService.controls.dniHolder.setErrors({
              serverError: null
            });
            this.formGroupBasicService.controls.dniHolder.updateValueAndValidity();
          } else {
            this.formGroupBasicService.controls.dniHolder.setErrors({
              serverError: 'Ingrese una numero de cedula valido '
            });
          }
        }
      }else{
        this.formGroupBasicService.controls.dniHolder.setErrors({
          serverError: null
        });

        this.formGroupBasicService.controls.dniHolder.updateValueAndValidity();
      }
    }

  }
  get formValues() { return this.formGroupBasicService.controls; }

  dniCheckCedRuc(){
    this.formGroupBasicService.controls.receRuc.markAsTouched();
    if(this.formGroupBasicService.controls.receRuc.valid){
      if(this.formGroupBasicService.controls.receRuc.value.length === 10){
        if(this.noDNI.includes(String(this.formGroupBasicService.controls.receRuc.value))) {
          this.formGroupBasicService.controls.receRuc.setErrors({
            serverError: 'Ingrese una numero de cedula valido '
          });
        } else {
          if(this.validadorDeCedula(this.formGroupBasicService.controls.receRuc.value)){
            this.formGroupBasicService.controls.receRuc.setErrors({
              serverError: null
            });
            this.formGroupBasicService.controls.receRuc.updateValueAndValidity();
          } else {
            this.formGroupBasicService.controls.receRuc.setErrors({
              serverError: 'Ingrese un numero de cedula valido '
            });
          }
        }
      }else if(this.formGroupBasicService.controls.receRuc.value.length > 10){
        if(this.noRUC.includes(String(this.formGroupBasicService.controls.receRuc.value))){
          this.formGroupBasicService.controls.receRuc.setErrors({
            serverError: 'Ingrese un número de ruc válido '
          });
        } else {
          if(this.validateRuc(this.formGroupBasicService.controls.receRuc.value)){
            this.formGroupBasicService.controls.receRuc.setErrors({
              serverError: null
            });
            this.formGroupBasicService.controls.receRuc.updateValueAndValidity();
          } else {
            this.formGroupBasicService.controls.receRuc.setErrors({
              serverError: 'Ingrese un número de ruc válido '
            })
          }
        }
      } else {
        this.formGroupBasicService.controls.receRuc.setErrors({
          serverError: null
        });

        this.formGroupBasicService.controls.receRuc.updateValueAndValidity();
      }
    }
  }

  validateRuc(ruc){
    if (ruc.substr(-3) == '000' || ruc.substr(-3) > '009') {
      return false;
    } else {
      if (ruc[2] < 6) {
        const provinceNum = parseInt(ruc.substring(0, 2));
        if(provinceNum < 25 && provinceNum > 0) {
          let total = 0;
          const arrayCoeficientes = [2,1,2,1,2,1,2,1,2];
          const digitVeriRec = parseInt(ruc.charAt(9) + '');
          for (let i = 0; i < arrayCoeficientes.length; i++) {
            const valor = parseInt(arrayCoeficientes[i] + '') * parseInt(ruc.charAt(i) + '');
            total = valor >= 10 ? total + (valor - 9) : total + valor;
          }
          const digitVeriObt = total >= 10 ? (total % 10) != 0 ? 10 - (total % 10) : (total % 10) : total;
          if (digitVeriObt == digitVeriRec) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else if (ruc[2] == '6') {
        const provinceNum = parseInt(ruc.substring(0, 2));
        if(provinceNum < 25 && provinceNum > 0) {
          if (ruc[9] == '0'){
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else if (ruc[2] == '9'){
        const provinceNum = parseInt(ruc.substring(0, 2));
        if(provinceNum < 25 && provinceNum > 0) {
          let total = 0;
          const arrayCoeficientes = [4,3,2,7,6,5,4,3,2];
          const digitVeriRec = parseInt(ruc.charAt(9) + '');
          for (let i = 0; i < arrayCoeficientes.length; i++) {
            const valor = parseInt(arrayCoeficientes[i] + '') * parseInt(ruc.charAt(i) + '');
            total = valor >= 10 ? total + (valor - 9) : total + valor;
          }
          const digitVeriObt = total >= 10 ? (total % 11) != 0 ? 10 - (total % 11) : (total % 11) : total;
          if (digitVeriObt == digitVeriRec) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      }
    }
  }

  getCompany(e){
    this.companiesLoad = false;
    const serviceID = e.value;

    if(e.value === ''){
      return false;
    }

    this.service = this.services.find(element => {
      return element.idService === e.value
    });
    this.cajaVerdeService.getCompanies({
      service:{
        idService: serviceID
      }
    }).subscribe(
      next=>{
        if(next.errorCode !== '0'){
          this.router.navigateByUrl('/oops');
        }else{
          this.companies = next.companys;
          this.companiesLoad = true;
        }
      },
      error => {
        this.router.navigateByUrl('/oops');
      });
  }

  setCompany(e) {
    this.company = this.companies.find(element => {
      return element.idCompany === e.value
    });
  }

  setRegion(e) {
    this.region = this.company.region.find(element => {
      return element.key === e.value
    });
  }

  setArea(e) {
    this.area = this.company.area.find(element => {
      return element.key === e.value
    });
  }

  fijo(): boolean{
    return ((this.company?.idCompany === 5479) && ( this.type?.key === '3' ) );
  }

  setType(e) {
    this.type = this.company.type.find(element => {
      return element.key === e.value
    });
  }

  validateSearch(): boolean{

    if(!this.validadorDeCedula(this.formGroupBasicService.controls.dniHolder.value)){
      this.matDialog.open(TransactionsAlertComponent, {data: {message: 'Ingrese una numero de cedula valido.', action: ''}});
      return false;
    }

    if(!this.formGroupBasicService.controls.dniHolder.valid){
      return false;
    }
    if(!this.formGroupBasicService.controls.company.valid){
      return false;
    }
    if(!this.formGroupBasicService.controls.serviceCode.valid){
      return false;
    }

    if ( this.company.region.length > 0 && !this.formGroupBasicService.controls.region.valid){
      return false;
    }

    if ( this.company.area.length > 0 && !this.formGroupBasicService.controls.area.valid){
      return false;
    }

    if ( this.company.type.length > 0 && !this.formGroupBasicService.controls.type.valid){
      return false;
    }

    return true;
  }

  searchService() {
    if(!this.validateSearch()){
      return false;
    }
    const requestServiceModel = new RequestServiceModel();

    this.formGroupBasicService.controls.dniHolder.disable();
    this.formGroupBasicService.controls.service.disable();
    this.formGroupBasicService.controls.company.disable();
    this.formGroupBasicService.controls.serviceCode.disable();
    this.formGroupBasicService.controls.region.disable();
    this.formGroupBasicService.controls.area.disable();
    this.formGroupBasicService.controls.type.disable();
    this.searching = true;

    requestServiceModel.serviceCode = this.formGroupBasicService.controls.serviceCode.value;

    const company = new CompanyModel();

    company.idCompany = this.formGroupBasicService.controls.company.value;

    if(this.company.type.length > 0){
      company.type = [];
      company.type.push(this.type)
    }
    company.area = [];
    if(this.fijo()){
      company.area.push(this.area)
    }

    if(this.company.region.length > 0){
      company.region = [];
      company.region.push(this.region)
    }
    requestServiceModel.company = company;

    this.cajaVerdeService.getService(requestServiceModel).subscribe(
      next=>{
        switch(next.errorCode){
          case '0':
            if (!(next.basicService.totalDbt > 0)){
              this.matDialog.open(TransactionsAlertComponent, {data: {message: ' Este servicio no refleja deudas', action: ''}});
              this.serviceLoad = true;
              this.otherService();
            } else {
              this.basicService = next.basicService;
              this.serviceLoad = true;
            }
            break;
          case '70013':
            this.matDialog.open(TransactionsAlertComponent, {data: {message: next.userMessage, action: ''}});
            break;
          case '122':
            this.matDialog.open(TransactionsAlertComponent, {data: {message: next.userMessage, action: ''}});
            break;
          case '70010':
            this.matDialog.open(TransactionsAlertComponent, {data: {message: next.userMessage, action: ''}});
            break;
          default:
            this.router.navigateByUrl('/oops');
            break;
        }
      },
      e => {
        this.router.navigateByUrl('/oops');
      },
      ()=>{
        this.formGroupBasicService.controls.dniHolder.enable();
        this.formGroupBasicService.controls.service.enable();
        this.formGroupBasicService.controls.company.enable();
        this.formGroupBasicService.controls.serviceCode.enable();
        this.formGroupBasicService.controls.region.enable();
        this.formGroupBasicService.controls.area.enable();
        this.formGroupBasicService.controls.type.enable();
        this.searching = false;
      }
    );
  }

  otherService() {
    this.basicService = new ServiceModel();
    this.serviceLoad = false;
    this.formGroupBasicService.controls.dniHolder.setValue('');
    this.formGroupBasicService.controls.service.setValue(0);
    this.formGroupBasicService.controls.company.setValue(0);
    this.formGroupBasicService.controls.serviceCode.setValue('');
    this.formGroupBasicService.controls.region.setValue(0);
    this.formGroupBasicService.controls.area.setValue(0);
    this.formGroupBasicService.controls.type.setValue(0);
  }

  addresNoFijo(){
    return (this.fijo() && this.company?.area.length > 0);
  }

  checkAmount() {

    if(Number(this.getTotalGlobal())  >= this.config.legalInformation){
      this.formGroupBasicService.controls.fundsSource.setValidators([Validators.required]);
      this.formGroupBasicService.controls.fundsDestination.setValidators([Validators.required]);
    }else{
      this.formGroupBasicService.controls.fundsSource.setValidators(null);
      this.formGroupBasicService.controls.fundsDestination.setValidators(null);
      this.total = this.getTotalGlobal();
    }
  }

  setTotal(){
    this.total = (
      this.formGroupBasicService.controls.effectiveAmount.value +
      this.formGroupBasicService.controls.amountCheck.value
    ).toFixed(2);
  }

  getTotalGlobal(){
    return Number((this.formGroupBasicService.controls.effectiveAmount.value + this.formGroupBasicService.controls.amountCheck.value).toFixed(2));
  }

  numberOnly($event: KeyboardEvent) {
    this.total = this.getTotalGlobal();
    if ($event.keyCode < 45 || $event.keyCode > 57 || $event.keyCode === 8) {
      return false;
    }
    this.total = this.getTotalGlobal();
    return true;
  }

  backSpace(event){
    this.total = this.getTotalGlobal();
    return true;
  }

  numberOnlyC($event: KeyboardEvent) {
    if(this.formGroupBasicService.controls.numberCheck.value<0){
      this.formGroupBasicService.controls.numberCheck.setValue(0);
      return false;
    }

    this.checkNumberCheqs();
    if ($event.keyCode <= 45 || $event.keyCode > 57 || $event.keyCode == 47 || $event.keyCode == 46) {
      return false;
    }
    this.total = this.getTotalGlobal();
    return true;
  }

  removeOneCheck() {
    if(this.formGroupBasicService.controls.numberCheck.value > 0){
      this.formGroupBasicService.controls.numberCheck.setValue( Number(this.formGroupBasicService.controls.numberCheck.value) - 1 );
    } else {
      this.formGroupBasicService.controls.numberCheck.setValue(0);
      this.formGroupBasicService.controls.amountCheck.setValue(0);
    }
    this.checkNumberCheqs();
  }

  addOneCheck() {
    this.formGroupBasicService.controls.numberCheck.setValue( Number(this.formGroupBasicService.controls.numberCheck.value) + 1 );
    this.checkNumberCheqs();
  }

  checkNumberCheqs() {
    if(this.formGroupBasicService.controls.numberCheck.value > 0){
      this.formGroupBasicService.controls.amountCheck.setValidators([Validators.required, Validators.min(1)]);
      this.formGroupBasicService.controls.effectiveAmount.setValidators(null);
    } else {
      this.formGroupBasicService.controls.amountCheck.setValue(0);
      this.formGroupBasicService.controls.effectiveAmount.setValidators([Validators.required]);
      this.formGroupBasicService.controls.amountCheck.setValidators(null);
      this.formGroupBasicService.controls.amountCheck.updateValueAndValidity();
      this.total = this.getTotalGlobal();
    }
  }

  onNumber(value: string): number {
    return Number(value);
  }

  factua() {
    if(!this.formGroupBasicService.controls.slideToggleFactura.value){
      this.formGroupBasicService.controls.receRuc.setValidators([Validators.required, Validators.pattern('^[0-9]*$'), Validators.minLength(10)]);
      this.formGroupBasicService.controls.receName.setValidators([Validators.required]);
    }else{
      this.formGroupBasicService.controls.receRuc.setValidators(null);
      this.formGroupBasicService.controls.receName.setValidators(null);
      this.formGroupBasicService.controls.receRuc.updateValueAndValidity();
      this.formGroupBasicService.controls.receName.updateValueAndValidity();
    }
  }

  save() {
    const controls = this.formGroupBasicService.controls;
    if (this.formGroupBasicService.invalid) {
      Object.keys(controls).forEach(controlName =>
        controls[controlName].markAsTouched()
      );

      /* if(controls.amountCheck.value < 1){
        this.matDialog.open(TransactionsAlertComponent, {data: {message: 'El monto en cheques debe ser al menos $1', action: ''}});
        return;
      } */

      this.matDialog.open(TransactionsAlertComponent, {data: {message: 'Debe completar todo el formulario', action: ''}});
      return;
    }

    if (Number(this.formGroupBasicService.controls.effectiveAmount.value) >this.config.maxAmmount){
      this.matDialog.open(TransactionsAlertComponent, {data: {message: 'El monto en efectivo excede el límite permitido para transacciones en caja verde.', action: ''}});
      return;
    }

    if(this.basicService.minAmount !== 0){
      if((Number(this.getTotalGlobal()) > this.basicService.totalDbt)){
        this.matDialog.open(TransactionsAlertComponent, {data: {message: 'El valor a pagar deber ser igual a $' + this.basicService.totalDbt  , action: ''}});
        return;
      }

      if((Number(this.getTotalGlobal()) < this.basicService.minAmount)){
        this.matDialog.open(TransactionsAlertComponent, {data: {message: 'El valor a pagar deber ser igual a $' + this.basicService.totalDbt  , action: ''}});
        return;
      }

    }else{
      if (Number(this.getTotalGlobal()) !== Number(this.basicService.totalDbt)){
        this.matDialog.open(TransactionsAlertComponent, {data: {message: 'El valor a pagar deber ser igual a $' + this.basicService.totalDbt  , action: ''}});
        return;
      }
    }

    // console.log(this.basicService.minAmount);

    if(this.basicService.minAmount === undefined){
      if (Number(this.getTotalGlobal()) !== Number(this.basicService.totalDbt)){
        this.matDialog.open(TransactionsAlertComponent, {data: {message: 'El valor a pagar deber ser igual a $' + this.basicService.totalDbt  , action: ''}});
        return;
      }
    }
    
    if(Number(this.formGroupBasicService.controls.amountCheck.value) > 10000000.00){
      this.matDialog.open(TransactionsAlertComponent, { data: { message: 'El monto en cheque excede el límite permitido para transacciones en caja verde.', action: '' } });
      return;
    }


    this.unsend = true;

    const transaction = new RequestTransactionDepositModel();
    transaction.typeNemonic = 'PS';
    transaction.accessType = (this.isDesktop$)?'W':'M';
    transaction.session = this.getSessionData();

    transaction.payService = this.getPayService();
    transaction.depositor = this.getDepositorInfo();

    if(!this.fijo()){
      transaction.payService
    }

    this.store.dispatch(new SaveTransactionsDeposit({transaction}));

  }

  getDepositorInfo():DepositorModel {
    const depositor = new DepositorModel();
    depositor.identification = ( this.formGroupBasicService.controls.slideToggleFactura.value)? this.formGroupBasicService.controls.receRuc.value : this.formGroupBasicService.controls.dniHolder.value;
    depositor.name = ( this.formGroupBasicService.controls.slideToggleFactura.value)? this.formGroupBasicService.controls.receName.value :  this.basicService.client.name ;
    depositor.mail = this.formGroupBasicService.controls.depositorEmail.value;
    depositor.identificationId = (this.validadorDeCedula(this.formGroupBasicService.controls.dniHolder.value))? 'C' : 'R';
    return depositor;
  }

  getSessionData(): SessionModel {
    const session = new SessionModel();
    session.sessionId = this.sessionID;
    session.deviceId = Number(localStorage.getItem(environment.varLocalStorageDevice));
    return session;
  }

  getPayService(): PayserviceModel {
    const ps= new PayserviceModel();
    const company = new CompanyModel();

    company.idCompany = this.formGroupBasicService.controls.company.value;

    if(this.company.type.length > 0){
      company.type = [];
      company.type.push(this.type)
    }


    company.area = [];
    if(this.fijo()){
      company.area.push(this.area)
    }

    if(this.company.region.length > 0){
      company.region = [];
      company.region.push(this.region)
    }

    ps.company = company;

    const client = new ClientModel();

    client.name = this.basicService.client.name;

    ps.client = client;

    ps.serviceCode = this.formGroupBasicService.controls.serviceCode.value;
    ps.nCheck = this.formGroupBasicService.controls.numberCheck.value;
    ps.commission = this.basicService.commission;
    ps.amountCash = this.formGroupBasicService.controls.effectiveAmount.value;
    ps.amountCheck = this.formGroupBasicService.controls.amountCheck.value;
    ps.totalAmount = this.formGroupBasicService.controls.effectiveAmount.value + this.formGroupBasicService.controls.amountCheck.value;
    ps.totalDbt = this.basicService.totalDbt;
    ps.fundsSource = this.formGroupBasicService.controls.fundsSource.value;
    ps.fundsDestination = this.formGroupBasicService.controls.fundsDestination.value;
    ps.bill = this.formGroupBasicService.controls.slideToggleFactura.value;
    ps.minAmount = null;

    return ps;
  }

  isControlHasError(controlName: string, validationType: string): boolean {
    const control = this.formGroupBasicService.controls[controlName];
    if (!control) {
      return false;
    }
    const result = control.hasError(validationType) && (control.dirty || control.touched);
    return result;
  }
}
