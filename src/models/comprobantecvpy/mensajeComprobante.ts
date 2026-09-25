export interface MensajeComprobante {
    uuid: string;
    uniqueTransCode: string;
    ipAgency: string;
    dateTrans: string;
    officeCode: string;
    officeUser: string;
    officeHours: string;
    currency: string;
    sec: string;
    transCode: string;
    transDescripction: string;
    deposit: boolean;
    payCard: boolean;
    payService: boolean;
    
    codeRec?: string;
    closingDate?: string;
    rucCompanyVal?: string;
    benfIdetification?: string;
    amountVal?: string;
    amountToDate?: string;
    accesKey?: string;
    benfNumberAccount?: string;
    
    unpaidMonth?: string;
    bill?: string;
    billDate?: string;
    startDate?: string;
    

    direction?: string;
}

