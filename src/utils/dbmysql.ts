import { createPool, FieldPacket, Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { logger } from './logger';
import { SecretsManager, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const SSL_DB = (process.env.SSL_DB || 'false').trim().toLowerCase() === 'true';

interface DbSecret {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
  dbInstanceIdentifier?: string;
}
// Usar una variable global para el pool que sobreviva entre invocaciones de Lambda
let pool: Pool | null = null;

export async function initializePool(): Promise<Pool> {
  // Solo inicializa el pool si no existe o si está cerrado
  if (pool) {
    try {
      // Verificar si el pool sigue siendo utilizable con un ping rápido
      await pool.query('SELECT 1');
      return pool;
    } catch (error) {
      logger.warn('Pool existente no responde, creando uno nuevo', error);
      await resetPool();
    }
  }

  try {
    const secretArn = process.env.SECRET_NAME;
    if (!secretArn) {
      logger.error('DB_SECRET_ARN no está definido en las variables de entorno bd');
      throw new Error('DB_SECRET_ARN no está definido en las variables de entorno bd');
    }

    try {
      const secretsManagerMysql = new SecretsManager({ region: process.env.REGION || 'us-east-1' });
      const commandMysql = new GetSecretValueCommand({ SecretId: secretArn });
      logger.info('Enviando solicitud a SecretsManager bd...');
      const responseMysql = await secretsManagerMysql.send(commandMysql);     
      logger.info('Respuesta recibida de SecretsManager');  
      if (!responseMysql.SecretString) {
        logger.error('El secreto no contiene un valor de cadena bd (SecretString)');
        throw new Error('El secreto no contiene un valor bd');
      }     
      logger.info('SecretString obtenido correctamente bd');     
      const secret: DbSecret = JSON.parse(responseMysql.SecretString);

      const sslConfig = SSL_DB ? { rejectUnauthorized: false, minVersion: 'TLSv1.2' as const } : undefined;
      logger.info(`MySQL SSL configuración - SSL_DB: ${SSL_DB}, SSL habilitado: ${SSL_DB ? 'SÍ' : 'NO'}`);

      pool = createPool({
          host: secret.host,
          user: secret.username,
          password: secret.password,
          database: secret.dbname,
          port: secret.port,
          connectionLimit: 5,
          multipleStatements: false,
          ssl: sslConfig
        });
    } catch (error) {
      logger.error('Error durante la obtención del secreto bd:', error);
      throw error;
    }

    logger.info('Pool de conexiones a la base de datos inicializado bd');
    return pool;
  } catch (error) {
    logger.error('Error al inicializar el pool de conexiones:', error);
    throw error;
  }
}


async function releaseConnection(connection:any) {
  try {        
    connection.release();        
    logger.info('Conexión devuelta al pool');        
    connection = null; // Asegurar que no se reutilice la conexión      
  } catch (releaseError) {        
    logger.info('Error al liberar la conexión:', releaseError);   
     }
}

export async function getConnection(retryCount = 0, maxRetries = 3): Promise<PoolConnection> {
  const dbPool = await initializePool();
  try {
    const connection = await dbPool.getConnection();
    logger.info('Conexión a la base de datos obtenida del pool');
    return connection;
  } catch (error: any) {
    if ((error.code === 'ER_CON_COUNT_ERROR' || error.code === 'POOL_CLOSED') && retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 100; // Backoff exponencial
      logger.warn(`Reintentando obtener conexión después de ${delay}ms (intento ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Si es un error de "Too many connections", intentar reiniciar el pool
      if (error.code === 'ER_CON_COUNT_ERROR' && retryCount >= 1) {
        logger.warn('Demasiadas conexiones, reiniciando pool antes del reintento');
        await resetPool();
      }
      
      return getConnection(retryCount + 1, maxRetries);
    }
    logger.error('Error al obtener una conexión del pool:', error);
    // Solo resetear el pool si es un error crítico
    await resetPool();
    
    throw error;
  }
}

export async function resetPool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
    } catch (error) {
      logger.warn('Error al cerrar el pool de conexiones:', error);
      
    } finally {
      pool = null;
      logger.info('Pool de conexiones reiniciado');
    }
  }
}


export async function executeStoredProcedureDeposit<T>(
  procedureName: string,
  params: any[]
): Promise<T> {
  let connection;
  try {
    logger.info(`=== INICIO executeStoredProcedureDeposit para ${procedureName} ===`);
    logger.info(`Parámetros recibidos (total: ${params.length}):`, JSON.stringify(params));
    
    connection = await getConnection();
    
    logger.info(`Conexión establecida exitosamente`);
    
    // Extraer los parámetros de salida (los últimos dos parámetros)
    const inputParams = params.slice(0, params.length - 2);
    logger.info(`Parámetros de entrada extraídos (total: ${inputParams.length}):`, JSON.stringify(inputParams));
    logger.info(`Parámetros de salida: últimos 2 serán variables de sesión`);
    
    // Verificar parámetros undefined/null
    const nullUndefinedParams = inputParams
      .map((param, index) => ({ index, param, type: typeof param }))
      .filter(item => item.param === undefined || item.param === null);
    
    if (nullUndefinedParams.length > 0) {
      logger.warn(`Parámetros null/undefined detectados:`, nullUndefinedParams);
    }
    
    // Inicializar las variables de sesión para los parámetros INOUT/OUT
    logger.info(`Inicializando variables de sesión...`);
    await connection.query('SET @s_error_code = 0');
    await connection.query('SET @s_status = 0');
    logger.info(`Variables de sesión inicializadas: @s_error_code=0, @s_status=0`);
    
    // Crear los placeholders para la consulta
    const placeholders = inputParams.map(() => '?').join(', ');
    logger.info(`Placeholders generados: ${placeholders}`);
    
    // Crear la consulta con los placeholders y las variables de sesión
    const query = `CALL ${procedureName}(${placeholders}, @s_error_code, @s_status)`;
    logger.info(`Query generada:`, query);
    
    logger.info(`Ejecutando procedimiento almacenado...`);
    const startTime = Date.now();
    
    let selectResult: [RowDataPacket[], FieldPacket[]];
    let outResult: [RowDataPacket[], FieldPacket[]];
    try {
      selectResult = await connection.query(query, inputParams);
      logger.info(`Resultado de selectResult: `, selectResult);
      const executionTime = Date.now() - startTime;
      logger.info(`Procedimiento ejecutado exitosamente en ${executionTime}ms`);
    } catch (queryError) {
      const executionTime = Date.now() - startTime;
      logger.error(`Error en ejecución del SP después de ${executionTime}ms:`, queryError);
      throw queryError;
    }
    
    // Obtener los valores de los parámetros de salida
    logger.info(`Recuperando valores de parámetros de salida...`);
    /*const*/ outResult = await connection.query(
      'SELECT @s_error_code AS s_error_code, @s_status AS s_status'
    );
    logger.info(`Resultado de OUT params:`, outResult);
    
    await releaseConnection(connection);
    logger.info(`Conexión devuelta al pool exitosamente`);
    
    logger.info(`=== FIN executeStoredProcedureDeposit ===`);
     
      return [
        selectResult[0][0] as T,
        outResult[0][0] as T
      ] as T;
  }  catch (error) {
    if (connection) {
      await releaseConnection(connection);
    }
    logger.error(`Error al ejecutar el procedimiento almacenado ${procedureName}:`, error);
    throw error;
  }
}
 

export async function executeStoredProcedureSession<T>(
  procedureName: string,
  params: any[]
): Promise<T> {
  let connection;
  try {
    logger.info(`iniciando get connection para pa_cv_isesion`);
    connection = await getConnection();

    // Inicializar la variable de sesión para el parámetro INOUT
    await connection.query('SET @s_status = NULL');

    const query = `CALL ${procedureName}(?, ?, @s_status)`;
    
    logger.info(`Ejecutando procedimiento almacenado ${procedureName} con params: ]`,params);
    await connection.query(query, params);
    
    // Obtenemos el parámetro de salida
    const [outResult] = await connection.query('SELECT @s_status AS s_status');
    
    logger.info(`Resultado de OUT param s_status:`, outResult);
    await releaseConnection(connection);
    
    return outResult as T;
  } catch (error) {
    if (connection) {
      await releaseConnection(connection);
    }
    logger.error(`Error al ejecutar el procedimiento almacenado pa_cv_isesion:`, error);
    throw error;
  }
}

export async function executeStoredProcedureRegisterInquiry<T>(
  procedureName: string,
  params: any[] // Debe contener: [e_idtransaccion, e_islike, e_comments, e_trn_type, s_ct_in, s_error_code_in, s_error_msg_in]
): Promise<T> {
  let connection;
  try {
    logger.info(`iniciando get connection`);
    connection = await getConnection();

    const [
      e_idtransaccion,
      e_islike,
      e_comments,
      e_trn_type,
      s_ct_in,
      s_error_code_in,
      s_error_msg_in
    ] = params;

    // Seteamos variables de sesión para los parámetros INOUT
    await connection.query('SET @s_ct = ?', [s_ct_in]);
    await connection.query('SET @s_error_code = ?', [s_error_code_in]);
    await connection.query('SET @s_error_msg = ?', [s_error_msg_in]);

    const query = `
      CALL ${procedureName}(?, ?, ?, ?, @s_ct, @s_error_code, @s_error_msg)
    `;

    logger.info(`Ejecutando procedimiento almacenado: ${procedureName}`);
    await connection.query(query, [e_idtransaccion, e_islike, e_comments, e_trn_type]);

    // Obtenemos los parámetros de salida
    const [outResult] = await connection.query(
      'SELECT @s_ct AS s_ct, @s_error_code AS s_error_code, @s_error_msg AS s_error_msg'
    );

    logger.info(`Resultado de OUT params:`, outResult);

    await releaseConnection(connection);
    return outResult as T;
  } catch (error) {
    await releaseConnection(connection);
    logger.info(`Error al ejecutar el procedimiento almacenado ${procedureName}:`, error);
    throw error;
  }
}



export async function executeStoredProcedureConfig<T>(
  procedureName: string
): Promise<T> {
  let connection;
  try {
    logger.info(`Ejecutando procedimiento almacenado: ${procedureName}`);
    connection = await getConnection();
    
    // Initialize INOUT variables with default values
    await connection.query('SET @s_tiempovida = NULL, @s_tiempovida_web = NULL, @s_canttransc = NULL, @s_infolegal = NULL, @s_maxefectivo = NULL');
    
    // Execute the stored procedure with the INOUT parameters
    await connection.query(`CALL ${procedureName}(@s_tiempovida, @s_tiempovida_web, @s_canttransc, @s_infolegal, @s_maxefectivo)`);
    
    // Retrieve the INOUT parameters after execution
    const [outResult] = await connection.query('SELECT @s_tiempovida as s_tiempovida, @s_tiempovida_web as s_tiempovida_web, @s_canttransc as s_canttransc, @s_infolegal as s_infolegal, @s_maxefectivo as s_maxefectivo');
    
    logger.info(`Conexión devuelta al pool`);
    await releaseConnection(connection);
    
    return outResult as T;
  } catch (error) {
    if (connection) {
      await releaseConnection(connection);
    }
    logger.info(`Error al ejecutar el procedimiento almacenado ${procedureName}:`, error);
    throw error;
  }
}

export async function executeStoredProcedureDevice<T>(
  procedureName: string,
  params: any[]
): Promise<T> {
  let connection;
  try {
    logger.info(`iniciando get connection`);
    connection = await getConnection();

    const [e_device, e_deviceos, s_status_in] = params;

    await connection.query('SET @s_status = ?', [s_status_in]);

    const query = `CALL ${procedureName}(?, ?, @s_status)`;
    logger.info(`Ejecutando procedimiento almacenado con INOUT param: ${procedureName}`);
    await connection.query(query, [e_device, e_deviceos]);

    const [outResult] = await connection.query('SELECT @s_status as s_status');
    logger.info(`Resultado de OUT param:`, outResult);

    await releaseConnection(connection);
    return outResult as T;
  } catch (error) {
    await releaseConnection(connection);
    logger.info(`Error al ejecutar el procedimiento almacenado ${procedureName}:`, error);
    throw error;
  }
}



export async function executeStoredProcedurePaCvCsign<T>(
  procedureName: string,
  params: any[]
): Promise<T> {
  let connection;
  try {
    logger.info(`iniciando get connection`);
    connection = await getConnection();
    
      // Create session variables for OUT parameters
      await connection.query('SET @s_sign = NULL, @s_error_code = NULL');
      
      // Replace NULL values for out parameters with session variables in the params array
      const inParams = params.slice(0, params.length - 2); // All parameters except the last two
      
      // Generate the query with session variables for OUT parameters
      const paramPlaceholders = inParams.map(() => '?').join(',');
      const query = `CALL ${procedureName}(${paramPlaceholders}, @s_sign, @s_error_code)`;
      
      logger.info(`Ejecutando procedimiento almacenado con OUT params: ${procedureName}`);
      await connection.query(query, inParams);
      // Retrieve the output parameter values
      const [outResults] = await connection.query('SELECT @s_sign as s_sign, @s_error_code as s_error_code');
      logger.info(`Resultados de OUT params:`, outResults);
      logger.info(`RESULT QUERY : `,outResults);
      await releaseConnection(connection);
      return outResults as T;
  } catch (error) {
    await releaseConnection(connection);
    logger.info(`Error al ejecutar el procedimiento almacenado ${procedureName}:`, error);
    throw error;
  } 
}

export async function executeStoredProcedurePyCard<T>(
  procedureName: string,
  params: any[]
): Promise<T> {
  let connection;
  try {
    logger.info(`=== INICIO executeStoredProcedurePyCard para ${procedureName} ===`);
    logger.info(`Parámetros recibidos (total: ${params.length}):`, JSON.stringify(params));
    
    connection = await getConnection();
    logger.info(`Conexión establecida exitosamente executeStoredProcedurePyCard`);
        // Para pa_cv_itransaction_tc, hay 10 parámetros INOUT (s_tt_id hasta s_error_msg)
    const numInOutParams = 10; // Corregido a 10 según tu procedimiento
    
    // Extraer los parámetros de entrada (todos excepto los INOUT/OUT)
    const inputParams = params.slice(0, params.length - numInOutParams);
    logger.info(`Parámetros de entrada extraídos (total: ${inputParams.length}):`, JSON.stringify(inputParams));
    logger.info(`Parámetros INOUT/OUT: últimos ${numInOutParams} serán variables de sesión`);
    
    // Verificar parámetros undefined/null
    const nullUndefinedParams = inputParams.map((param, index) => ({ index, param, type: typeof param })).filter(item => item.param === undefined || item.param === null);
    logger.info(`Verificar párametros undefined: ${JSON.stringify(nullUndefinedParams)}`)
    
    // Inicializar las variables de sesión para los parámetros INOUT/OUT
    logger.info(`Inicializando variables de sesión...`);
    
    // Definir nombres de las variables de sesión según el procedimiento
    const sessionVarNames = ['s_tt_id', 's_id_transaction_type', 's_life_time', 's_ip', 's_uuid', 's_os', 's_date_create', 's_ct', 's_error_code', 's_error_msg'];
    
    // Inicializar todas las variables de sesión con valores NULL
    for (const varNamePycard of sessionVarNames) {
      await connection.query(`SET @${varNamePycard} = NULL`);
      logger.info(`Variable de sesión inicializada: @${varNamePycard}=NULL`);
    }
    
    // Crear los placeholders para la consulta (solo parámetros de entrada)
    const inputPlaceholdersPycard = inputParams.map(() => '?').join(', ');
    // Variables de sesión para los parámetros INOUT/OUT
    const sessionVarPlaceholders = sessionVarNames.map(name => `@${name}`).join(', ');
    logger.info(`Input placeholders: ${inputPlaceholdersPycard}`);
    logger.info(`Session var placeholders: ${sessionVarPlaceholders}`);
    
    // Crear la consulta con los placeholders
    const query = `CALL ${procedureName}(${inputPlaceholdersPycard}, ${sessionVarPlaceholders})`;
    logger.info(`Query generada:`, query);
    logger.info(`Ejecutando procedimiento almacenado... ${procedureName}`);
    
    await connection.query(query, inputParams);
  
    // Obtener los valores de los parámetros de salida
    logger.info(`Recuperando valores de parámetros de salida...`);
    // Construir la consulta para recuperar todas las variables de sesión
    const selectColumns = sessionVarNames.map(name => '@' + name + ' AS ' + name).join(', ');
    const selectVarsQuery = 'SELECT ' + selectColumns;

    logger.info(`Query para obtener variables de sesión: ${selectVarsQuery}`);
    
    const outResult = await connection.query(selectVarsQuery);
    logger.info(`Resultado de OUT params:`, JSON.stringify(outResult[0], null, 2));
    
    await releaseConnection(connection);
    logger.info(`Conexión devuelta al pool exitosamente`);
    logger.info(`=== FIN executeStoredProcedurePyCard ===`);    
    return outResult[0] as T;
  } catch (error) {
    if (connection) {
      await releaseConnection(connection);
    }
    logger.error(`Error al ejecutar el procedimiento almacenado ${procedureName}:`, error);
    throw error;
  }
}

export async function executeStoredProcedurePay<T>(
  procedureName: string,
  params: any[]
): Promise<T> {
  let connection;
  try {
    logger.info(`=== INICIO executeStoredProcedurePay para ${procedureName} ===`);
    logger.info(`Parámetros recibidos (total: ${params.length}):`, JSON.stringify(params));
    
    connection = await getConnection();
    logger.info(`Conexión establecida exitosamente`);
    
    // Identificar cuántos parámetros INOUT/OUT hay en el procedimiento
    // Para pa_cv_itransaction_ps, hay 11 parámetros INOUT (s_ts_id hasta s_error_msg)
    const numInOutParams = 11;
    
    // Extraer los parámetros de entrada (todos excepto los INOUT/OUT)
    const inputParams = params.slice(0, params.length - numInOutParams);
    logger.info(`Parámetros de entrada extraídos (total: ${inputParams.length}):`, JSON.stringify(inputParams));
    logger.info(`Parámetros INOUT/OUT: últimos ${numInOutParams} serán variables de sesión`);
    
    // Verificar parámetros undefined/null
    const nullUndefinedParams = inputParams
      .map((param, index) => ({ index, param, type: typeof param }))
      .filter(item => item.param === undefined || item.param === null);
    
    if (nullUndefinedParams.length > 0) {
      logger.warn(`Detectados ${nullUndefinedParams.length} parámetros undefined/null:`, JSON.stringify(nullUndefinedParams));
    }
    
    // Inicializar las variables de sesión para los parámetros INOUT/OUT
    logger.info(`Inicializando variables de sesión...`);
    
    // Definir nombres de las variables de sesión según el procedimiento pa_cv_itransaction_ps
    const sessionVarNames = [
      's_ts_id', 's_id_transaction_type', 's_life_time', 's_ip', 
      's_uuid', 's_os', 's_date_create', 's_ct', 's_se_id', 
      's_error_code', 's_error_msg'
    ];
    
    // Inicializar todas las variables de sesión con valores NULL
    for (const varName of sessionVarNames) {
      await connection.query(`SET @${varName} = NULL`);
      logger.info(`Variable de sesión inicializada: @${varName}=NULL`);
    }
    
    // Crear los placeholders para la consulta (solo parámetros de entrada)
    const inputPlaceholders = inputParams.map(() => '?').join(', ');
    // Variables de sesión para los parámetros INOUT/OUT
    const sessionVarPlaceholders = sessionVarNames.map(name => `@${name}`).join(', ');
    
    
    logger.info(`Input placeholders: ${inputPlaceholders}`);
    logger.info(`Session var placeholders: ${sessionVarPlaceholders}`);
    
    // Crear la consulta con los placeholders
    const query = `CALL ${procedureName}(${inputPlaceholders}, ${sessionVarPlaceholders})`;
    logger.info(`Query generada:`, query);
    
    logger.info(`Ejecutando procedimiento almacenado...`);
    const startTime = Date.now();
    
    try {
      await connection.query(query, inputParams);
      const executionTime = Date.now() - startTime;
      logger.info(`Procedimiento ejecutado exitosamente en ${executionTime}ms`);
    } catch (queryError) {
      const executionTime = Date.now() - startTime;
      logger.error(`Error en ejecución del SP después de ${executionTime}ms:`, queryError);
      throw queryError;
    }
    
    // Obtener los valores de los parámetros de salida
    logger.info(`Recuperando valores de parámetros de salida...`);
    
    // Construir la consulta para recuperar todas las variables de sesión
    const selectColumns = sessionVarNames.map(name => '@' + name + ' AS ' + name).join(', ');
    const selectVarsQuery = 'SELECT ' + selectColumns;

    logger.info(`Query para obtener variables de sesión: ${selectVarsQuery}`);
    
    const outResult = await connection.query(selectVarsQuery);
    logger.info(`Resultado de OUT params:`, JSON.stringify(outResult, null, 2));
    
    await releaseConnection(connection);
    logger.info(`Conexión devuelta al pool exitosamente`);
    
    logger.info(`=== FIN executeStoredProcedurePay ===`,outResult);
    
    // Retornar el resultado como array para mantener compatibilidad con el código existente
    return outResult[0] as T;
  } catch (error) {
    if (connection) {
      await releaseConnection(connection);
    }
    logger.error(`Error al ejecutar el procedimiento almacenado ${procedureName}:`, error);
    throw error;
  }
}

export async function executeStoredProcedure<T>(
  procedureName: string,
  params: any[]
): Promise<T> {
  let connection;
  try {
    logger.info(`iniciando get connection`);
    connection = await getConnection();
    
    // Generar la cadena de parámetros (?, ?, ?, etc.) según la cantidad de parámetros
    const proceduresWithOutParams = [
      'pa_cv_itransactioncheck',
      'pa_cv_itransactioncheck_tc',
      'pa_cv_itransactioncheck_ps'
    ];
    
    const hasOutParams = proceduresWithOutParams.includes(procedureName);
    
    if (hasOutParams) {
      // For procedures with OUT parameters, use session variables
      // Create session variables for OUT parameters
      await connection.query('SET @s_status = NULL, @s_error_msg = NULL');
      
      // Replace NULL values for out parameters with session variables in the params array
      const inParams = params.slice(0, params.length - 2); // All parameters except the last two
      
      // Generate the query with session variables for OUT parameters
      const paramPlaceholders = inParams.map(() => '?').join(',');
      const query = `CALL ${procedureName}(${paramPlaceholders}, @s_status, @s_error_msg)`;
      
      logger.info(`Ejecutando procedimiento almacenado con OUT params: ${procedureName}`);
      await connection.query(query, inParams);
      
      // Retrieve the output parameter values
      const [outResults] = await connection.query('SELECT @s_status as status, @s_error_msg as error_msg');
      logger.info(`Resultados de OUT params:`, outResults);
      
      await releaseConnection(connection);
      return outResults as T;
    }else{
      const paramPlaceholders = params.map(() => '?').join(',');
      const query = `CALL ${procedureName}(${paramPlaceholders})`;
      
      logger.info(`Ejecutando procedimiento almacenado: ${procedureName}`);
      const [results] = await connection.query(query, params);
      logger.info(`CONEXION: `,connection);
      logger.info(`RESULT QUERY : `,results);
       await releaseConnection(connection);
      return results as T;
    }
    
  } catch (error) {
    await releaseConnection(connection);
    logger.info(`Error al ejecutar el procedimiento almacenado ${procedureName}:`, error);
    throw error;
  } 
}

export async function executeQuery<T>(query: string, params: any[] = []): Promise<T> {
  let connection;
  try {
    connection = await getConnection();
    logger.debug(`Ejecutando query: ${query}`);
    const [results] = await connection.query(query, params);
    logger.debug(`RESULT QUERY : ${results}`);
    await releaseConnection(connection);
    return results as T;
  } catch (error) {
     await releaseConnection(connection);
    logger.error(`Error al ejecutar query: ${query}`, error);
    throw error;
  } 
}
