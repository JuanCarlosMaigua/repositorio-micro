import {BaseModel} from './_base.model';
import {ConfigModel} from './config.model';
import {DeviceModel} from './device.model';

export class ResRegisterDeviceModel extends BaseModel{
  configuration: ConfigModel;
  device: DeviceModel;

}
