import { Injectable } from '@angular/core';
import {EndpointService} from '../endpoint/endpoint.service';
import {Account} from '../../app/models/account.model';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  constructor(private coreEndpoint: EndpointService) { }

  getDataAccount(a: Account){
    return this.coreEndpoint.getDataAccount(a);
  }
}
