// NGRX
import { createSelector } from '@ngrx/store';
// Lodash
import { each, find, some } from 'lodash';
// Selectors
// Models

export const selectCajaVerdeState = state => state.cajaVerde;

export const isRegistered = createSelector(selectCajaVerdeState, cajaVerde => cajaVerde.deviceRegistered);
export const hasTransaction = createSelector(selectCajaVerdeState, cajaVerde => cajaVerde.hasTransaction);
export const lengthTransaction = createSelector(selectCajaVerdeState, cajaVerde => cajaVerde.hasTransaction.length);
export const isConfigLoaded = createSelector(selectCajaVerdeState, cajaVerde => !cajaVerde.deviceConfigLoad);
export const transactions = createSelector(selectCajaVerdeState, cajaVerde => cajaVerde.transactions);
export const config = createSelector(selectCajaVerdeState, cajaVerde => cajaVerde.deviceConfig);
export const isDesktop = createSelector(selectCajaVerdeState, cajaVerde => {return (cajaVerde.deviceType === 'Desktop')});
export const sessionID = createSelector(selectCajaVerdeState, cajaVerde => cajaVerde.sessionID);
export const isNotDesktop = createSelector(selectCajaVerdeState, cajaVerde => {return (cajaVerde.deviceType !== 'Desktop')});
export const qr = createSelector(selectCajaVerdeState, cajaVerde => cajaVerde.transactionQR);
export const voucher = createSelector(selectCajaVerdeState, cajaVerde => cajaVerde.transactionVoucher);


export const lifeTime = createSelector(selectCajaVerdeState, cajaVerde => {
  if (cajaVerde.deviceType === 'Desktop'){
    return cajaVerde.deviceConfig.lifeTimeWeb;
  } else {
    return cajaVerde.deviceConfig.lifeTimeMobile;
  }
});


