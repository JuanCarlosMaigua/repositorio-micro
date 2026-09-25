export class CustomError extends Error {
    errorCode: string;
    userMessage: string;

    constructor(errorCode: string, userMessage: string, systemMessage: string) {
        super(systemMessage);
        this.errorCode = errorCode;
        this.userMessage = userMessage;
        this.name = 'CustomError';
    }
}