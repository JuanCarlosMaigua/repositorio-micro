import { logger } from './logger';
import fetch from 'node-fetch';
import * as https from 'https';

export interface HttpClientConfig {
    url: string;
    timeout: number;
    sslEnabled: string | boolean; 
    logPrefix?: string;
    sanitizeResponse?: boolean;
}

export class HttpClient {
    constructor(private readonly config: HttpClientConfig) {}

    async post(body: string): Promise<string> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            logger.info(`Iniciando petición`);

            const requestBody = typeof body === 'string'
                ? body
                : JSON.stringify(body);
            
            const sslEnabled = parseBoolean(this.config.sslEnabled);
            const httpsAgent = new https.Agent({ rejectUnauthorized: sslEnabled });
 
            const response = await fetch(this.config.url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
                body: requestBody,
                signal: controller.signal as any,
                agent: httpsAgent
            });

            if (!response.ok) {
                logger.error(`  Error HTTP ${response.status}`);
                throw new Error(`Error en la petición HTTP: ${response.status}`);
            }

            const responseData = await response.text();
            logger.info(`  Petición completada exitosamente`);

            return responseData;

        } catch (error: any) { 
            const errorName = error?.name ? ` (${error.name})` : '';
            logger.error(`  Error en petición${errorName}`);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timed out');
            }

            throw new Error('Error en la petición HTTP');
            
        } finally {
            clearTimeout(timer);
        }
    }
}

function parseBoolean(value: string | boolean): boolean {
    if (typeof value === 'boolean') {
        return value;
    }

    return value.trim().toLowerCase() === 'true';
}