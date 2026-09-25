import { createClient, RedisClientType } from 'redis';
import { logger } from '../../utils/logger';
import { CVService } from '../../models/recaudacioncvpy/Service';
import { Company } from '../../models/transaccioncvpy/company';
import { SecretsManager, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

let redisClient: RedisClientType | null = null;
let TTL: number = 86400000;
// Redis config

const CACHE_KEYS = {
  SERVICES: 'services',
  COMPANYS: 'companys',
  CATALOG: 'catalog',
  CATALOG_COMPANY_ATTR: 'catalogCompanyAttr',
};

interface DbSecretRedis {
  REDIS_MAX_IDLE_TIME?: string;
  REDIS_PASSWORD?: string;
  REDIS_SERVER?: string;
  REDIS_TTL?: string;
}

// Get or create Redis client
export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient?.isOpen) {
    logger.info('Reusing existing Redis client redis');
    return redisClient;
  }

  logger.info('Creating new Redis client redis ...');
        /* INICIO RASJ*/
        const secretArn = process.env.SECRET_NAME_REDIS ;
        if (!secretArn) {
          logger.error('DB_SECRET_ARN no está definido en las variables de entorno redis');
          throw new Error('DB_SECRET_ARN no está definido en las variables de entorno redis');
        }
    
          logger.info(`Creando cliente de SecretsManager para región redis: ${process.env.REGION || 'us-east-1'}`);
          const secretsManager = new SecretsManager({ region: process.env.REGION || 'us-east-1' });
          
          const command = new GetSecretValueCommand({ SecretId: secretArn });
          
          logger.info('Enviando solicitud a SecretsManager redis...');
          const response = await secretsManager.send(command);
          
          logger.info('Respuesta recibida de SecretsManager redis');
          
          if (!response.SecretString) {
            logger.error('El secreto no contiene un valor de cadena redis (SecretString)');
            throw new Error('El secreto no contiene un valor redis');
          }
           
          // No loguear el secreto completo por seguridad, solo confirmar su presencia
          const secret: DbSecretRedis = JSON.parse(response.SecretString);
          const redisServer = secret.REDIS_SERVER || '';
          const redisPassword = secret.REDIS_PASSWORD || '';
          TTL = parseInt(secret.REDIS_TTL || '86400000', 10); // Default 24h
          const redisUrl = new URL(redisServer);
        /* FIN RASJ */
        const clientOptions: any = {
      socket: {
      host: redisUrl.hostname,
      port: parseInt(redisUrl.port || '6379'),
      connectTimeout: 2000,  // Reduced timeout
      tls: redisUrl.protocol === 'rediss:',
    },
    commandTimeout: 3000,  // Reduced command timeout
  };

  if (redisPassword) {
    clientOptions.password = redisPassword;
  }
  redisClient = createClient(clientOptions);

  redisClient.on('error', (err: any) => {
    logger.error('Redis Client Error', err);
  });

  await redisClient.connect();
  logger.info('Connected to Redis');

  return redisClient;
}

async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  shouldCache: (data: T) => boolean = () => true, // Add this parameter with a default
): Promise<T | null> {
  try {
    const client = await getRedisClient();
    logger.info(`Checking cache for key: ${key}`);
    const cachedData = await client.get(key);
    if (cachedData) {
      logger.info(`Cache hit for key: ${key}`);
      return JSON.parse(cachedData) as T;
    }
    logger.info(`Cache miss for key: ${key}. Fetching data...`);
    const data = await fetcher();
    if (data && shouldCache(data)) { // Only cache if it passes the condition
      logger.info(`TTL :: ${TTL}`);
      await client.set(key, JSON.stringify(data), { PX: TTL });
      logger.info(`Cache set for key: ${key}`);
    }
    return data;
  } catch (error) {
    logger.error(`Cache error for key: ${key}`, error);
    try {
      return await fetcher(); // fallback
    } catch (fallbackError) {
      logger.error(`Fetcher failed for key: ${key}`, fallbackError);
      return null;
    }
  }
}

// Public methods
export async function getServices(
  fetcher: () => Promise<CVService[]>,
): Promise<CVService[] | null> {
  return getOrSetCache(CACHE_KEYS.SERVICES, fetcher);
}

export async function getCompanys(
  serviceId: number,
  fetcher: (id: number) => Promise<Company[]>,
): Promise<Company[] | null> {
  const key = `${CACHE_KEYS.COMPANYS}:${serviceId}`;
  // Only cache if the array has items
  return getOrSetCache(key, () => fetcher(serviceId), (data) => Array.isArray(data) && data.length > 0);
}

export async function getCatalog(
  table: string,
  fetcher: (table: string) => Promise<Record<string, string>>,
): Promise<Record<string, string>> {
  const key = `${CACHE_KEYS.CATALOG}:${table}`;
  const result = await getOrSetCache(key, () => fetcher(table));
  return result ?? {};
}

export async function getCatalogCompanyAttr(
  id: number,
  fetcher: (id: number) => Promise<Record<string, string>>,
): Promise<Record<string, string>> {
  const key = `${CACHE_KEYS.CATALOG_COMPANY_ATTR}:${id}`;
  const result = await getOrSetCache(key, () => fetcher(id));
  return result ?? {};
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient?.isOpen) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}
