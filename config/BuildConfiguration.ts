import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import * as yaml from "js-yaml";
import { logger } from "../src/utils/logger";
import * as dotenv from "dotenv";

export class BuildConfiguration {
    private readonly nameStackApplication: string;
    private readonly stage: string;
    constructor(nameStackApplication: string, stage: string) {
        this.nameStackApplication = nameStackApplication;
        this.stage = stage;
    }
    async getConfig(): Promise<any> {
        dotenv.config();
        try {
            const nameEnvironmentSsm = `/${this.nameStackApplication}/${this.stage}`;
            console.log(`### Getting config from .env`);
             
            
            const buildConfigResponse: any = {
                STAGE: this.stage, // variable by defual, not remove it 
                VPC_ID:  process.env.VPC_ID,
                SUBNET_1a: process.env.SUBNET_1a,
                SUBNET_1b: process.env.SUBNET_1b,
                SUBNET_1c: process.env.SUBNET_1c,
                SECURITY_GROUP_DEFAULT: process.env.SECURITY_GROUP_DEFAULT,
                DB_SECRET_ARN: process.env.DB_SECRET_ARN,
                CUENTACVMS_CONN_TIMEOUT: process.env.CUENTACVMS_CONN_TIMEOUT ?? "20000",
                CUENTACVMS_READ_TIMEOUT: process.env.CUENTACVMS_READ_TIMEOUT ?? "200000",
                CUENTACVMS_URL: process.env.CUENTACVMS_URL,
                CUENTACV_CONN_TIMEOUT: process.env.CUENTACV_CONN_TIMEOUT,
                CUENTACV_CRON: process.env.CUENTACV_CRON,
                CUENTACV_READ_TIMEOU: process.env.CUENTACV_READ_TIMEOU,
                CUENTA_PORT: process.env.CUENTA_PORT,
                CV_GATEWAY: process.env.CV_GATEWAY,
                IP_WSDL: process.env.IP_WSDL,
                RECAUDACIONCVMS_CONN_TIMEOUT: process.env.RECAUDACIONCVMS_CONN_TIMEOUT,
                RECAUDACIONCVMS_READ_TIMEOUT: process.env.RECAUDACIONCVMS_READ_TIMEOUT,
                RECAUDACIONCVMS_URL: process.env.RECAUDACIONCVMS_URL,
                SECRET_NAME_REDIS: process.env.SECRET_NAME_REDIS,
                SECRET_NAME: process.env.SECRET_NAME,
                SECRET_REGION: process.env.SECRET_REGION,
                TARJETACVMS_CONN_TIMEOUT: process.env.TARJETACVMS_CONN_TIMEOUT,
                TARJETACVMS_READ_TIMEOUT: process.env.TARJETACVMS_READ_TIMEOUT,
                TARJETACVMS_URL: process.env.TARJETACVMS_URL,
                TIME_ZONE_MYSQL_SP: process.env.TIME_ZONE_MYSQL_SP,
                TRANSACCIONCVMS_CONN_TIMEOUT: process.env.TRANSACCIONCVMS_CONN_TIMEOUT,
                TRANSACCIONCVMS_READ_TIMEOUT: process.env.TRANSACCIONCVMS_READ_TIMEOUT,
                TRANSACCIONCVMS_URL: process.env.TRANSACCIONCVMS_URL,        
                COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
                COGNITO_RESOURCE_SERVER_ID: process.env.COGNITO_RESOURCE_SERVER_ID,
                COGNITO_SCOPE_NAME: process.env.COGNITO_SCOPE_NAME,
                URL_CORS: process.env.URL_CORS,
                SSL_CLIENTE: process.env.SSL_CLIENTE,
                SSL_DB: process.env.SSL_DB,
                TOKEN_LIMIT: process.env.TOKEN_LIMIT ?? "8", 
            };

            logger.info(`### buildConfig OK:\n${JSON.stringify(buildConfigResponse, null, 2)}`);

            return buildConfigResponse;
        } catch (error) {
            logger.error("error getConfig", error);
            logger.error(`### I cant retrive the SSM Parameter from AWS`);
            return {
                STAGE: this.stage,
            };
        }
    }

    ensureString(object: { [name: string]: any }, propName: string): string {
        if (!object[propName] || object[propName].trim().length === 0)
            throw new Error(propName + " does not exist or is empty");

        return object[propName];
    }
}
