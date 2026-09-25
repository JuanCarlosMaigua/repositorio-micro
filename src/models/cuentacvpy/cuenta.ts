export interface Cuenta {
    accountName: string;
    accountNumber: string;
    accountTypeCode: number; // 1 Ahorro, 2 Corriente
    accountOwnerDNI: string;
    mail?: string;
    phone?: string;
}