import { Injectable } from '@angular/core';
import {EndpointService} from '../endpoint/endpoint.service';
import {Observable} from 'rxjs';
import {Transaction} from '../../app/models/transaction.model';
import {DeviceModel} from '../../app/models/device.model';
import {SessionModel} from '../../app/models/session.model';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  key = 'i-route';

  constructor(private coreEndpoint: EndpointService) { }
  // CryptoJS
  encrypt(t) {
      return t;
  }

  decrypt(t) {
    return t;
  }

  fullscreenCv() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.requestFullscreen) {
      /* IE/Edge */
      elem.requestFullscreen();
    }
    // @ts-ignore
    if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
      // tslint:disable-next-line:only-arrow-functions
      setTimeout(function(){
        window.screen.orientation.lock('natural');
      }    , 200);
    }
  }

  getMobileOperatingSystem() {
    const userAgent = navigator.userAgent || navigator.vendor;

    /*if (/windows phone/i.test(userAgent)) {
      return 'Windows Phone';
    }*/
    if (/android/i.test(userAgent)) {
      return 'Android';
    }
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'iOS';
    }
    return 'desconocido';
  }

  invokeToken() {
    return this.coreEndpoint.getAuthorization();
  }

  getDeviceID() {
    return this.decrypt(localStorage.getItem('deviceIdentifier'));
  }

  newDevice(deviceIdentifier): Observable<DeviceModel> {
    return this.coreEndpoint.newDevice(deviceIdentifier, this.getMobileOperatingSystem());
  }

  addTransaction(a) {
    return this.coreEndpoint.addTransaction(a);
  }

  getTransactions(): Observable<Transaction[]> {
    return this.coreEndpoint.getAllTransactions(this.getDeviceID());
  }

  addPullResponse(transactionID, like, comment) {
    if (like === undefined) {
      like = '0';
    }
    if (comment === undefined) {
      comment = '0';
    }
    return this.coreEndpoint.addPullResponse(transactionID, like, comment);
  }

  starSession(a): Observable<SessionModel> {
  return this.coreEndpoint.starSession(a);
  }

  closeSession(a) {
    return this.coreEndpoint.closeSession(a);
  }

}
