import { createClient } from 'redis';
import { logger } from '../../utils/logger';
import { InMsgGenerarLogFrontEnd } from '../../models/cuentacvpy/inMsgGenerarLogFrontEnd';

export class TrackingRepository {
    private readonly redisServer: string;
    private readonly redisPassword: string;

    constructor() {
        this.redisServer = process.env.REDIS_SERVER || '';
        this.redisPassword = process.env.REDIS_PASSWORD || '';
    }

    // Create a new Redis client and execute operation
    async executeRedisOperation<T>(operation: (client: any) => Promise<T>): Promise<T> {
        const redisUrl = new URL(this.redisServer);
        
        const clientOptions: any = {
            socket: {
                host: redisUrl.hostname,
                port: parseInt(redisUrl.port || '6379'),
                connectTimeout: 2000,  // Reduced timeout
                tls: redisUrl.protocol === 'rediss:',
            },
            commandTimeout: 3000,  // Reduced command timeout
        };
        
        if (this.redisPassword) {
            clientOptions.password = this.redisPassword;
        }
        
        const client = createClient(clientOptions);
        
        client.on('error', (err: any) => {
            logger.error('Redis Client Error', err);
        });
        
        try {
            await client.connect();
            logger.info('Connected to Redis');
            
            // Execute the operation with timeout
            const result = await Promise.race([
                operation(client),
                new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('Redis operation timeout')), 3000)
                )
            ]);
            
            return result;
        } finally {
            // Always close the connection
            try {
                await client.quit();
                logger.info('Redis connection closed');
            } catch (err) {
                logger.error('Error closing Redis connection:', err);
            }
        }
    }

    async registrarLog(logEntry: InMsgGenerarLogFrontEnd): Promise<boolean> {
        try {
            // Asegurarse de que timestamp está presente
            if (!logEntry.timestamp) {
                logEntry.timestamp = new Date().toISOString();
            }
            
            const logEntryJson = JSON.stringify(logEntry);
            const logKey = `log:${Date.now()}:${crypto.randomUUID().replace(/-/g, '').substring(0, 13)}`;
            
            logger.info(`Guardando log con clave: ${logKey}`);
            
            // Usar el método de operación con Redis
            await this.executeRedisOperation(async (client) => {
                // First try a simple ping to test connectivity
                await client.ping();
                logger.info('Redis PING successful');
                
                // Then try a simple SET operation to see if that works
                await client.set(`test:${logKey}`, 'test-value', { EX: 60 });
                logger.info('Redis SET successful');
                
                // Only then try the HSET operation
                return await client.hSet('trakingFrontend', logKey, logEntryJson);
            });
            
            logger.info(`Log guardado exitosamente con clave: ${logKey}`);
            return true;
        } catch (error) {
            logger.error('Error al registrar log:', error);
            return false;
        }
    }
}