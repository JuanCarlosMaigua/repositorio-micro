import { handler } from "../../../src/functions/cuentacvpy/obtenerCuenta";
import { CuentaService } from "../../../src/services/cuentacvpy/cuentaService";
import { Context } from 'aws-lambda';


// Mock utilidades
jest.mock('../../../src/services/cuentacvpy/cuentaService');

const contextMock = {} as Context;

describe('obtenerCuenta handler', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    it('debe retornar datos correctos si la cuenta existe', async () => {
      const mockGetAccount = jest.fn().mockResolvedValue({
        errorCode: '0',
        userMessage: 'Transaccion ok',
        systemMessage: 'Transaccion ok',
        account: {
          accountName: 'ADRIAN REQUENA PEREZ',
          accountNumber: '0005308109',
          accountTypeCode: '0',
          accountOwnerDNI: '0951600873',
          mail: 'prueba11l@gmail.com',
          phone: '0980235411',
        },
      });
      (CuentaService as jest.Mock).mockImplementation(() => ({
        getAccount: mockGetAccount,
      }));
  
      const event = {
        queryStringParameters: { accountNumber: '0005308109' },
        headers: {},
      } as any;
  
      const result = await handler(event, contextMock);
      const parsed = JSON.parse(result.body);
  
      expect(result.statusCode).toBe(200);
      expect(parsed.errorCode).toBe('0');
      expect(parsed.account.accountName).toBe('ADRIAN REQUENA PEREZ');
    });
  
    it('debe retornar error si la cuenta no existe', async () => {
      const mockGetAccount = jest.fn().mockResolvedValue({
        errorCode: '-1',
        userMessage: 'Cuenta no existe',
        systemMessage: 'Cuenta no existe',
        account: {
          accountName: '',
          accountNumber: '0004430810',
          accountTypeCode: '1',
          accountOwnerDNI: '',
          mail: '',
          phone: '',
        },
      });
      (CuentaService as jest.Mock).mockImplementation(() => ({
        getAccount: mockGetAccount,
      }));
  
      const event = {
        queryStringParameters: { accountNumber: '0004430810' },
        headers: {},
      } as any;
  
      const result = await handler(event, contextMock);
      const parsed = JSON.parse(result.body);
  
      expect(result.statusCode).toBe(200); // la API responde con 200, aunque haya error lógico
      expect(parsed.errorCode).toBe('-1');
      expect(parsed.userMessage).toBe('Cuenta no existe');
      expect(parsed.account.accountName).toBe('');
    });
    
  });
  