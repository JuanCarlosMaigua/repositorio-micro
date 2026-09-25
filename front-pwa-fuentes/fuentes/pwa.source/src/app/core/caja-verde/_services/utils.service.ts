// Angular
import { Injectable } from '@angular/core';
// RxJS
import {BehaviorSubject, Observable, of, Subject} from 'rxjs';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Router} from '@angular/router';
import {ResTokenModel} from '../_models/_res-token.model';
import {ResRegisterDeviceModel} from '../_models/_res-register-device.model';
import {RequestRegisterDeviceModel} from '../_models/_request-register-device.model';
import {ResStartSessionModel} from '../_models/_res-start-session.model';
import {ResLsitTransactionsModel} from '../_models/_res-lsit-transactions.model';
import {ResAccountModel} from '../_models/_res-account.model';
import {ResSaveTransactionsModel} from '../_models/_res-save-transactions.model';
import {TransactionModel} from '../_models/transaction.model';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../reducers';
import {config, lifeTime, transactions} from '../_selectors/caja-verde.selectors';
import {DeviceDetectorService} from 'ngx-device-detector';
import {ConfigModel} from '../_models/config.model';

@Injectable()
export class UtilsService {
  lifeTime;
  config: ConfigModel;
  /**
   * Service constructor
   */
  constructor(private store: Store<AppState>, private deviceService: DeviceDetectorService) {
    this.store.pipe(select(config)).subscribe(
      next => {
        this.config = next;
      }
    );
  }


  isDesktop(){
    return this.deviceService.isDesktop();
  }

  getExpirationDate(date: Date){
    let plus;
    if(this.isDesktop()){
      plus = Number(this.config.lifeTimeWeb)*3600000;
    }else{
      plus = Number(this.config.lifeTimeMobile)*3600000;
    }

    const today = new Date();
    const future = new Date(date);
    const diffMs = ((future.getTime()+plus) - today.getTime()); // milliseconds between now & Christmas
    return Math.floor((diffMs % 86400000) / 3600000);
  }

  getName(transaction: TransactionModel): string{
    switch(transaction.typeNemonic) {
      case 'TC': {
        return transaction.payCard.client.name;
        break;
      }
      case 'DP': {
        return transaction.deposit.client.name;
        break;
      }
      case 'PS': {
        return transaction.payService.client.name;
        break;
      }
      default: {
        return 'Desconocido';
        break;
      }
    }
  }

  getNumberCheck(transaction: TransactionModel): number{
    switch(transaction.typeNemonic) {
      case 'TC': {
        return transaction.payCard.nCheck;
        break;
      }
      case 'DP': {
        return transaction.deposit.nCheck;
        break;
      }
      case 'PS': {
        return transaction.payService.nCheck;
        break;
      }
      default: {
        return 0;
        break;
      }
    }
  }

  getTotalCheck(transaction: TransactionModel): number{
    switch(transaction.typeNemonic) {
      case 'TC': {
        return Number((transaction.payCard.amountCheckBb + transaction.payCard.amountTotalCheckEx + transaction.payCard.amountCheckOb).toFixed(2));
        break;
      }
      case 'DP': {
        return transaction.deposit.amountCheck;
        break;
      }
      case 'PS': {
        return transaction.payService.amountCheck;
        break;
      }
      default: {
        return 0;
        break;
      }
    }
  }

  getTotalCash(transaction: TransactionModel): number{
    switch(transaction.typeNemonic) {
      case 'TC': {
        return transaction.payCard.amountCash;
        break;
      }
      case 'DP': {
        return transaction.deposit.amountCash;
        break;
      }
      case 'PS': {
        return transaction.payService.amountCash;
        break;
      }
      default: {
        return 0;
        break;
      }
    }
  }

  getTotal(transaction: TransactionModel): string{
    switch(transaction.typeNemonic) {
      case 'TC': {
        return String(transaction.payCard.totalAmount);
        break;
      }
      case 'DP': {
        const total = transaction.deposit.amountCash + transaction.deposit.amountCheck
        return String(total);
        break;
      }
      case 'PS': {
        return String(transaction.payService.totalAmount);
        break;
      }
      default: {
        return 'Desconocido';
        break;
      }
    }
  }

  getDescripcion(transaction: TransactionModel): string{
    switch(transaction.typeNemonic) {
      case 'TC': {
        return transaction.payCard.cardType + ' - ' + transaction.payCard.cardNumber;
        break;
      }
      case 'DP': {
        const type = (transaction.deposit.accountTypeCode == 0) ? 'Corriente' : 'Ahorro';
        return transaction.deposit.accountNumber + ' - ' + type;
        break;
      }
      case 'PS': {
        return transaction.payService.serviceCode + ' - ' + transaction.payService.company.nameCompany;
        break;
      }
      default: {
        return 'Desconocido';
        break;
      }
    }

  }


  getTransactionType(typeNemonic: string): string{

    switch(typeNemonic) {
      case 'TC': {
        return 'Pago de Tarjeta de Crédito';
        break;
      }
      case 'DP': {
        return 'Depósito';
        break;
      }
      case 'PS': {
        return 'Pago de Servicios básicos';
        break;
      }
      default: {
        return 'Desconocido';
        break;
      }
    }

  }

  getDateofExpiry(date: string){
    let plus;
    if(this.isDesktop()){
      plus = Number(this.config.lifeTimeWeb);
    }else{
      plus = Number(this.config.lifeTimeMobile);
    }

    const create = new Date();

    const endDate = new Date(String(date).replace(/ /g,'T'));
    endDate.setHours(endDate.getHours()+plus);

    let diff =(endDate.getTime() - create.getTime()) / 1000;
    let minutes = Math.floor(diff/60);
    let hours = Math.floor(minutes/60);
    const days = Math.floor(hours/24);

    hours = hours-(days*24);
    // hours = hours;
    minutes = minutes-(days*24*60)-(hours*60);
    diff = diff-(days*24*60*60)-(hours*60*60)-(minutes*60);

    let res = '';

    if(hours === 1 ){
      res += hours + ' Hora, ';
    }else if (hours > 1){
      res += hours + ' Horas, ';
    }

    if(minutes === 1 ){
      res += minutes + ' Minuto, ';
    }else if (minutes > 1){
      res += minutes + ' Minutos, ';
    }
    return res;

  }

  msToTime(duration) {
    // tslint:disable-next-line:prefer-const
    let milliseconds = Math.floor((duration % 1000) / 100),
      seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60),
      hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? 0 + hours : hours;
    minutes = (minutes < 10) ? 0 + minutes : minutes;
    seconds = (seconds < 10) ? 0 + seconds : seconds;

    return hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
  }

  Faltan(s) {

    const ms = s % 1000;
    s = (s - ms) / 1000;
    const secs = s % 60;
    s = (s - secs) / 60;
    const mins = s % 60;
    const hrs = (s - mins) / 60;
    const days = hrs/24;

    let res = '';

    if(days > 1){
      res+= days + ' Dias, ';
    } else if (hrs == 1) {
      res+= days + ' Dia,';
    }

    if (hrs > 1) {
      if (mins !== 0) {
        res+= hrs + ' horas y ' + mins + ' mins';
      } else {
        res+= hrs + ' horas';
      }
      // tslint:disable-next-line:triple-equals
    } else if (hrs == 1) {
      if (mins !== 0) {
        res+= '1 hora y ' + mins + ' mins';
      } else {
        res+= '1 hora';
      }
    } else {
      if (mins > 1) {
        res+= mins + ' mins';
      } else {
        res+= '1 min';
      }
    }

    return res;
  }

  ValidarTiempo(s) {

    const ms = s % 1000;
    s = (s - ms) / 1000;
    const secs = s % 60;
    s = (s - secs) / 60;
    const mins = s % 60;
    const hrs = (s - mins) / 60;

    if (hrs <= 0 && mins <= 0) {
      return true;
    } else {
      return false;
    }
  }

  hToMS(h) {
    return h * (60 * 60 * 1000);
  }

}
