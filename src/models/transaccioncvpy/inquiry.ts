export interface Inquiry {
    transactionID: number;
    liked: boolean;
    comment: string;
    deviceIdentifier?: number;
    sessionID?: number;
}

export interface InquiryRequest {
    transactionID: number;
    like: boolean;
    comment: string;
    typeNemonic?: string; // Campo opcional, podemos asignarle un valor por defecto en el repositorio
}