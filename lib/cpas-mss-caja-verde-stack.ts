import { Stack, StackProps, Duration, RemovalPolicy, CfnOutput, CfnResource } from 'aws-cdk-lib';
import { CfnAccount, CfnDeployment, CorsOptions, LambdaIntegration, MethodLoggingLevel, RestApi, RestApiProps, ApiKey, UsagePlan, UsagePlanPerApiStage, Deployment, Stage  } from 'aws-cdk-lib/aws-apigateway';
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime, Tracing, FunctionUrl, FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as path from 'path';
import {
  Vpc,
  SecurityGroup,
  Subnet,
  ISubnet,
  SubnetType
} from 'aws-cdk-lib/aws-ec2';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { IUserPool, ResourceServerScope, UserPool, UserPoolResourceServer } from 'aws-cdk-lib/aws-cognito';
// Y también debes importar las clases necesarias
import { 
  AuthorizationType,
  CognitoUserPoolsAuthorizer, 
  MethodOptions 
} from 'aws-cdk-lib/aws-apigateway';

export class CpasMssCajaVerdeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const config = props?.tags || {};

    // VPC Configuration
    const vpcLambda = Vpc.fromVpcAttributes(this, "VpcLambdaCajaVerde", { 
      vpcId: config.VPC_ID || process.env.VPC_ID || '',
      availabilityZones: ["us-east-1a", "us-east-1b", "us-east-1c"]
    });

    // Subnets
    const subnetIdsLambdas_ = [
      config.SUBNET_1a || '',
      config.SUBNET_1b || '',
      config.SUBNET_1c || '',
    ];

    const subnets: ISubnet[] = subnetIdsLambdas_.map((subnetId, index) => {
      return Subnet.fromSubnetId(
        this,
        `subnet-${this.stackName}-${index + 1}`,
        subnetId
      );
    });

    // Security Group
    const securityGroup = SecurityGroup.fromSecurityGroupId(
      this,
      'securityGroupLambdas',
      config.SECURITY_GROUP_DEFAULT || ''
    );

    //const secretDBArn = config.DB_SECRET_ARN || process.env.DB_SECRET_ARN || '';SECRET_NAME

   // const dbSecret = Secret.fromSecretCompleteArn(this, 'ImportedDBSecret', secretDBArn);
   const secretDBArn = config.SECRET_NAME || process.env.SECRET_NAME || '';

    const dbSecret = Secret.fromSecretNameV2(this, 'ImportedDBSecret', secretDBArn);
    console.log(`Secreto ${dbSecret}`);

    const secretRedisName = config.SECRET_NAME_REDIS || process.env.SECRET_NAME_REDIS || '';

    const redisSecret = Secret.fromSecretNameV2(this, 'ImportedRedisSecret', secretRedisName);


    // Rol para las funciones Lambda
    const lambdaRole = new Role(this, 'LambdaExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      description: `Rol para las funciones Lambda de ${this.stackName}`
    });

    
    // Políticas para el rol - Add CloudWatch and X-Ray permissions
    lambdaRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
        'xray:PutTraceSegments',
        'xray:PutTelemetryRecords',
        'xray:GetSamplingRules',
        'xray:GetSamplingTargets',
        'xray:GetSamplingStatisticSummaries'
      ],
      resources: ['*']
    }));

    // VPC access permissions
    lambdaRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'ec2:CreateNetworkInterface',
        'ec2:DescribeNetworkInterfaces',
        'ec2:DeleteNetworkInterface',
        'ec2:AssignPrivateIpAddresses',
        'ec2:UnassignPrivateIpAddresses'
      ],
      resources: ['*']
    }));

    // Acceso al secreto de base de datos
    dbSecret.grantRead(lambdaRole);
    redisSecret.grantRead(lambdaRole);
    // Create CloudWatch log group for all Lambda functions
      new LogGroup(this, 'CajaVerdeLambdaLogsV4', {
        logGroupName: `/aws/lambda/logs-${this.stackName}`,
        retention: RetentionDays.TWO_WEEKS,
        removalPolicy: RemovalPolicy.DESTROY
      });
     
    //const existeGroupLog = LogGroup.fromLogGroupName(this, 'CajaVerdeLambdaLogs',`/aws/lambda/${this.stackName}`);

    // Configuración común para todas las funciones Lambda
    const commonFunctionProps: NodejsFunctionProps = {
      runtime: Runtime.NODEJS_18_X,
      handler: 'handler',
      timeout: Duration.seconds(90), //PRUEBA 30
      environment: {
        STAGE: config.STAGE || process.env.STAGE || 'dev',
        REGION: this.region,
       // DB_SECRET_ARN: dbSecret.secretArn,
        LOG_LEVEL: 'INFO',
      
        // Servicios CVMS
        CUENTACVMS_CONN_TIMEOUT: config.CUENTACVMS_CONN_TIMEOUT || process.env.CUENTACVMS_CONN_TIMEOUT || '20000',
        CUENTACVMS_READ_TIMEOUT: config.CUENTACVMS_READ_TIMEOUT || process.env.CUENTACVMS_READ_TIMEOUT || '200000',
        CUENTACVMS_URL: config.CUENTACVMS_URL || process.env.CUENTACVMS_URL || '',

                // Puertos
        CUENTACV_CONN_TIMEOUT: config.CUENTACV_CONN_TIMEOUT || process.env.CUENTACV_CONN_TIMEOUT || '10000',
        CUENTACV_CRON: config.CUENTACV_CRON || process.env.CUENTACV_CRON || '',
        CUENTACV_READ_TIMEOU: config.CUENTACV_READ_TIMEOU || process.env.CUENTACV_READ_TIMEOU || '100000',
        CUENTA_PORT: config.CUENTA_PORT || process.env.CUENTA_PORT || '8082',
      
        CV_GATEWAY: config.CV_GATEWAY || process.env.CV_GATEWAY || '*',
        IP_WSDL: config.IP_WSDL || process.env.IP_WSDL || '',
        RECAUDACIONCVMS_CONN_TIMEOUT: config.RECAUDACIONCVMS_CONN_TIMEOUT || process.env.RECAUDACIONCVMS_CONN_TIMEOUT || '10000',
        RECAUDACIONCVMS_READ_TIMEOUT: config.RECAUDACIONCVMS_READ_TIMEOUT || process.env.RECAUDACIONCVMS_READ_TIMEOUT || '100000',
        RECAUDACIONCVMS_URL: config.RECAUDACIONCVMS_URL || process.env.RECAUDACIONCVMS_URL || '',
        SECRET_NAME: config.SECRET_NAME || process.env.SECRET_NAME || '',
        SECRET_NAME_REDIS : config.SECRET_NAME_REDIS || process.env.SECRET_NAME_REDIS || '',
        SECRET_REGION: config.SECRET_REGION || process.env.SECRET_REGION || '',

        TARJETACVMS_CONN_TIMEOUT: config.TARJETACVMS_CONN_TIMEOUT || process.env.TARJETACVMS_CONN_TIMEOUT || '10000',
        TARJETACVMS_READ_TIMEOUT: config.TARJETACVMS_READ_TIMEOUT || process.env.TARJETACVMS_READ_TIMEOUT || '100000',
        TARJETACVMS_URL: config.TARJETACVMS_URL || process.env.TARJETACVMS_URL || '',
        TIME_ZONE_MYSQL_SP: config.TIME_ZONE_MYSQL_SP || process.env.TIME_ZONE_MYSQL_SP || 'UTC',
            
        TRANSACCIONCVMS_CONN_TIMEOUT: config.TRANSACCIONCVMS_CONN_TIMEOUT || process.env.TRANSACCIONCVMS_CONN_TIMEOUT || '10000',
        TRANSACCIONCVMS_READ_TIMEOUT: config.TRANSACCIONCVMS_READ_TIMEOUT || process.env.TRANSACCIONCVMS_READ_TIMEOUT || '100000',
        TRANSACCIONCVMS_URL: config.TRANSACCIONCVMS_URL || process.env.TRANSACCIONCVMS_URL || '',


        COGNITO_USER_POOL_ID: config.COGNITO_USER_POOL_ID || process.env.COGNITO_USER_POOL_ID || '',
        COGNITO_RESOURCE_SERVER_ID: config.COGNITO_RESOURCE_SERVER_ID || process.env.COGNITO_RESOURCE_SERVER_ID || '',
        COGNITO_SCOPE_NAME: config.COGNITO_SCOPE_NAME || process.env.COGNITO_SCOPE_NAME || '',
        URL_CORS: config.URL_CORS || process.env.URL_CORS || '',
        SSL_CLIENTE: config.SSL_CLIENTE || process.env.SSL_CLIENTE || '',  
        SSL_DB: config.SSL_DB || process.env.SSL_DB || '',  
        TOKEN_LIMIT: config.TOKEN_LIMIT || process.env.TOKEN_LIMIT || '8'
      },

      role: lambdaRole,
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: true
      },
      // VPC configuration
      vpc: vpcLambda,
      vpcSubnets: { subnets: subnets },
      securityGroups: [securityGroup],
      // Enable X-Ray tracing
      tracing: Tracing.ACTIVE
    };
    // Configuración de CORS para el API Gateway
    const corsOptions: CorsOptions = {
      allowOrigins: config.CV_GATEWAY
      ? config.CV_GATEWAY.split(',').map(s => s.trim())
      : ['*'],
      allowMethods: ['GET', 'POST', 'OPTIONS', 'PUT'],
      allowHeaders: [
        'Content-Type',
        'X-Requested-With',
        'accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers',
        'secuencial',
        'Authorization' , // Añadir Authorization para Cognito
        'x-api-key'  // añadido 05 / 07 2025 rsuarezj por cors
      ],
      allowCredentials: false
    };

    // Configurar Cognito
    const { userPool, authScope } = this.importExistingCognito(config.COGNITO_USER_POOL_ID,config.COGNITO_RESOURCE_SERVER_ID,config.COGNITO_SCOPE_NAME);

    // Crear un rol para que API Gateway pueda escribir en CloudWatch Logs
    const apiGatewayLogsRole = new Role(this, 'ApiGatewayLogsRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs')
      ],
      description: 'Rol para permitir que API Gateway escriba logs en CloudWatch'
    });

    // Configurar la cuenta de API Gateway para usar este rol
    const apiGatewayAccount = new CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: apiGatewayLogsRole.roleArn
    });

    const stage = config.STAGE || process.env.STAGE || 'dev';
    // Crear API Gateway with X-Ray tracing enabled
   /* const apiProps: RestApiProps = {
      restApiName: `${this.stackName}-api`,
      description: `API para el proyecto ${this.stackName}`,
      //defaultCorsPreflightOptions: corsOptions,
      deploy:false
    };*/

    const api = new RestApi(this,`${this.stackName}-api`,{
      restApiName: `${this.stackName}-api`,
      description: `API para el proyecto ${this.stackName}`,
      deploy:false
    })

    /*
    deployOptions: {
        stageName: stage,  //descomentar al solucionar el release y frontend
        tracingEnabled: true,
        dataTraceEnabled: true, 
        loggingLevel: MethodLoggingLevel.INFO
      }//, retainDeployments: true
    */
    const deployment = new Deployment(this,`${this.stackName}ApiDeployment`,{
      api
    });

    const apiStage = new Stage(this,`${this.stackName}ApiStage`,{
      deployment,
      stageName:stage, 
      tracingEnabled: true,
      dataTraceEnabled: true, 
      loggingLevel: MethodLoggingLevel.INFO
    });

    api.deploymentStage=apiStage;
   // const api = new RestApi(this, `${this.stackName}Api`, apiProps);

    // Crear API Key
    const apiKey = new ApiKey(this, 'CajaVerdeApiKey', {
      apiKeyName: `${this.stackName}-api-key`,
      description: 'API Key para acceder a los endpoints de Caja Verde',
      enabled: true
    });

    // Crear Plan de Uso y asociar la API Key
    const usagePlan = new UsagePlan(this, 'CajaVerdeUsagePlan', {
      name: `${this.stackName}-usage-plan`,
      description: 'Plan de uso para Caja Verde API',
      apiStages: [
        {
          api,
          stage: api.deploymentStage
        }
      ],
    });

    // Asociar la API Key con el plan de uso
    usagePlan.addApiKey(apiKey);

    const cfnApi = api.node.defaultChild as CfnResource;
    cfnApi.addDependsOn(apiGatewayAccount);
    
    // Crear un autorizador Cognito para API Gateway
    const authorizer = new CognitoUserPoolsAuthorizer(this, 'CajaVerdeApiAuthorizer', {
      cognitoUserPools: [userPool],
      identitySource: 'method.request.header.Authorization',
      authorizerName: 'cognito-autorizer'
    });

    // Opciones de método con autorización
    const authorizerWithAuth: MethodOptions = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer,
      authorizationScopes: [`${authScope}`],
      apiKeyRequired: false //true
    };

    // Recurso principal de la API
    //const rootApi = api.root.addResource(this.stackName);
    // ============================================================= TRANSACTION CV PY API =============================================================
    const tarjetaCvPyEnv = {
      ...commonFunctionProps.environment,
      TARJETACVMS_URL: config.TARJETACVMS_URL || process.env.TARJETACVMS_URL || '',
      TARJETACVMS_CONN_TIMEOUT: config.TARJETACVMS_CONN_TIMEOUT || process.env.TARJETACVMS_CONN_TIMEOUT || '8000',
      TARJETACVMS_READ_TIMEOUT: config.TARJETACVMS_READ_TIMEOUT || process.env.TARJETACVMS_READ_TIMEOUT || '25000',
      SERVICE_CAMEL_USERNAME: config.SERVICE_CAMEL_USERNAME || process.env.SERVICE_CAMEL_USERNAME || '',
      SERVICE_CAMEL_PASSWORD: config.SERVICE_CAMEL_PASSWORD || process.env.SERVICE_CAMEL_PASSWORD || '',
      SERVICE_CAMEL_ENCRYP_USERNAME: config.SERVICE_CAMEL_ENCRYP_USERNAME || process.env.SERVICE_CAMEL_ENCRYP_USERNAME || '',
    };

       // Environment variables for the RecaudacionCvPy service
       const recaudacionCvPyEnv = {
        ...commonFunctionProps.environment,
        SERVICE_CAMEL_USERNAME: config.SERVICE_CAMEL_USERNAME || process.env.SERVICE_CAMEL_USERNAME || '',
        SERVICE_CAMEL_PASSWORD: config.SERVICE_CAMEL_PASSWORD || process.env.SERVICE_CAMEL_PASSWORD || '',
        SERVICE_CAMEL_ENCRYP_USERNAME: config.SERVICE_CAMEL_ENCRYP_USERNAME || process.env.SERVICE_CAMEL_ENCRYP_USERNAME || '',
        SSL_CLIENT: config.SSL_CLIENT || process.env.SSL_CLIENT || '',
      };

      const cuentaCvPyEnv = {
        ...commonFunctionProps.environment,
        CUENTACVMS_URL: config.CUENTACVMS_URL || process.env.CUENTACVMS_URL || '',
        CUENTACVMS_CONN_TIMEOUT: config.CUENTACVMS_CONN_TIMEOUT || process.env.CUENTACVMS_CONN_TIMEOUT || '20000', //'8000',
        CUENTACVMS_READ_TIMEOUT: config.CUENTACVMS_READ_TIMEOUT || process.env.CUENTACVMS_READ_TIMEOUT || '200000', //'25000',
        SERVICE_CAMEL_USERNAME: config.SERVICE_CAMEL_USERNAME || process.env.SERVICE_CAMEL_USERNAME || '',
        SERVICE_CAMEL_PASSWORD: config.SERVICE_CAMEL_PASSWORD || process.env.SERVICE_CAMEL_PASSWORD || '',
        SERVICE_CAMEL_ENCRYP_USERNAME: config.SERVICE_CAMEL_ENCRYP_USERNAME || process.env.SERVICE_CAMEL_ENCRYP_USERNAME || '',
      };


    const transaccionResource = api.root.addResource('Transaccion');//transaccioncvpy

    
    // Endpoints para Device
    const deviceHandler = new NodejsFunction(this, 'DeviceFunction', {
      functionName: `${this.stackName}-device-function`,
      entry: path.join(__dirname, '../src/functions/transaccioncvpy/device/index.ts'),
      ...commonFunctionProps
    });
    const guardarDispositivoResource = transaccionResource.addResource('almacenarDispositivo');//guardarDispositivo
    guardarDispositivoResource.addMethod('POST', new LambdaIntegration(deviceHandler), authorizerWithAuth);
    guardarDispositivoResource.addCorsPreflight(corsOptions);

    // Endpoints para Session
    const sessionHandler = new NodejsFunction(this, 'SessionFunction', {
      functionName: `${this.stackName}-session-function`,
      entry: path.join(__dirname, '../src/functions/transaccioncvpy/session/index.ts'),
      ...commonFunctionProps
    });

    const iniciarSessionResource = transaccionResource.addResource('iniciarSesion');
    iniciarSessionResource.addMethod('POST', new LambdaIntegration(sessionHandler), authorizerWithAuth);
    iniciarSessionResource.addCorsPreflight(corsOptions);

    const cerrarSessionResource = transaccionResource.addResource('cerrarSesion');
    cerrarSessionResource.addMethod('POST', new LambdaIntegration(sessionHandler), authorizerWithAuth);
    cerrarSessionResource.addCorsPreflight(corsOptions);

    // Endpoints para Transaction
    const listarTransactionHandler = new NodejsFunction(this, 'ListarTransactionFunction', {
      functionName: `${this.stackName}-listar-transaction-function`,
      entry: path.join(__dirname, '../src/functions/transaccioncvpy/transaccion/listarTransaccion.ts'),
      memorySize: 1024,
      ...commonFunctionProps
    });
    const listarTransaccionResource = transaccionResource.addResource('obtenerComprobante');
    listarTransaccionResource.addMethod('POST', new LambdaIntegration(listarTransactionHandler), authorizerWithAuth);
    listarTransaccionResource.addCorsPreflight(corsOptions);

    const guardarTransactionHandler = new NodejsFunction(this, 'GuardarTransactionFunction', {
      functionName: `${this.stackName}-guardar-transaction-function`,
      entry: path.join(__dirname, '../src/functions/transaccioncvpy/transaccion/guardarTransaccion.ts'),
      memorySize: 1024,
      ...commonFunctionProps
    });
    const guardarTransaccionResource = transaccionResource.addResource('guardarDeposito');
    guardarTransaccionResource.addMethod('POST', new LambdaIntegration(guardarTransactionHandler), authorizerWithAuth);
    guardarTransaccionResource.addCorsPreflight(corsOptions);

    const almacenarComprobanteResource = transaccionResource.addResource('almacenarComprobante');
    almacenarComprobanteResource.addMethod('POST', new LambdaIntegration(guardarTransactionHandler), authorizerWithAuth);
    almacenarComprobanteResource.addCorsPreflight(corsOptions);

    const consultarTransactionHandler = new NodejsFunction(this, 'ConsultarTransactionFunction', {
      functionName: `${this.stackName}-consultar-transaction-function`,
      entry: path.join(__dirname, '../src/functions/transaccioncvpy/transaccion/consultarTransaccion.ts'),
      memorySize: 1024,
      ...commonFunctionProps
    });

    const consultarTransaccionUrl = consultarTransactionHandler.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE
    });
      // Output para la URL directa
      new CfnOutput(this, 'ConsultarTransaccionUrl', {
        description: 'URL directa para consultarTransaccion (sin API Gateway)',
        value: consultarTransaccionUrl.url
      });

    const consultarTransaccionResource = transaccionResource.addResource('consultarTransaccion'); /// SE REALIZA MEDIANTE URL DIRECTA SIN APIGATEWAY rsuarezj
    consultarTransaccionResource.addMethod('POST', new LambdaIntegration(consultarTransactionHandler), authorizerWithAuth);
    consultarTransaccionResource.addCorsPreflight(corsOptions);

    // Endpoints para Poll
    const pollHandler = new NodejsFunction(this, 'PollFunction', {
      functionName: `${this.stackName}-poll-function`,
      entry: path.join(__dirname, '../src/functions/transaccioncvpy/poll/index.ts'),
      ...commonFunctionProps
    });

    const guardarEncuestaResource = transaccionResource.addResource('almacenarEncuesta');
    guardarEncuestaResource.addMethod('POST', new LambdaIntegration(pollHandler), authorizerWithAuth);
    guardarEncuestaResource.addCorsPreflight(corsOptions);

    // Endpoints para Inquiry   - TransaccionCvPY/guardarEncuesta      NO VA POR APIGATEWAY - RASJ
    const inquiryHandler = new NodejsFunction(this, 'InquiryFunction', {
      functionName: `${this.stackName}-inquiry-function`,
      entry: path.join(__dirname, '../src/functions/transaccioncvpy/inquiry/index.ts'),
      ...commonFunctionProps
    });

    const consultarInquiryResource = transaccionResource.addResource('consultarInquiry');
    consultarInquiryResource.addMethod('POST', new LambdaIntegration(inquiryHandler), authorizerWithAuth);
    consultarInquiryResource.addCorsPreflight(corsOptions);

    // Recaudaciones está atado al ApiGateway
    const consultarEmpresasHandler = new NodejsFunction(this, 'ConsultarEmpresasFunction', {
      functionName: `${this.stackName}-recaudacioncvpy-consultarempresas`,
      entry: path.join(__dirname, '../src/functions/recaudacioncvpy/consultarEmpresas.ts'),
      memorySize: 1024,
      environment: recaudacionCvPyEnv,
      ...commonFunctionProps,
    });
    const consultarEmpresasResource = transaccionResource.addResource('obtenercompanias');
    consultarEmpresasResource.addMethod('POST', new LambdaIntegration(consultarEmpresasHandler), authorizerWithAuth);
    consultarEmpresasResource.addCorsPreflight(corsOptions);

    const consultarServicioBasicoHandler = new NodejsFunction(this, 'ConsultarServicioBasicoFunction', {
      functionName: `${this.stackName}-recaudacioncvpy-consultarserviciobasico`,
      entry: path.join(__dirname, '../src/functions/recaudacioncvpy/consultarServicioBasico.ts'),
      memorySize: 1024,
      environment: recaudacionCvPyEnv,
      ...commonFunctionProps,
    });
    const consultarServicioBasicoResource = transaccionResource.addResource('obtenerInformacionServicio');
    consultarServicioBasicoResource.addMethod('POST', new LambdaIntegration(consultarServicioBasicoHandler), authorizerWithAuth);
    consultarServicioBasicoResource.addCorsPreflight(corsOptions);

    // Create RecaudacionCvPy Lambda functions
    const consultarServiciosHandler = new NodejsFunction(this, 'ConsultarServiciosFunction', {
      functionName: `${this.stackName}-recaudacioncvpy-consultarservicios`,
      entry: path.join(__dirname, '../src/functions/recaudacioncvpy/consultarServicios.ts'),
      memorySize: 1024,
      environment: recaudacionCvPyEnv,
      ...commonFunctionProps,
    });
    const consultarServiciosResource = transaccionResource.addResource('obtenerservicios');
    consultarServiciosResource.addMethod('POST', new LambdaIntegration(consultarServiciosHandler), authorizerWithAuth);
    consultarServiciosResource.addCorsPreflight(corsOptions);

    const tarjetaCvPyConsultaraHandler = new NodejsFunction(this, 'TarjetaCvPyConsultarFunction', {
      functionName: `${this.stackName}-tarjetacvpy-consultartarjetas`,
      entry: path.join(__dirname, '../src/functions/tarjetacvpy/consultarTarjetas.ts'),
      memorySize: 1024,
      environment: tarjetaCvPyEnv,
      ...commonFunctionProps,
    });
    const consultarTarjetasCvPyResource = transaccionResource.addResource('obtenertarjetas');
    consultarTarjetasCvPyResource.addMethod('POST', new LambdaIntegration(tarjetaCvPyConsultaraHandler), authorizerWithAuth);
    consultarTarjetasCvPyResource.addCorsPreflight(corsOptions);

   
    // =============================================================  CUENTA CV PY API ============================================================= 
  // Usa una única función Lambda sin la versión duplicada
    const loggerTrakingHandler = new NodejsFunction(this, 'LoggerTrakingFunction', {
      functionName: `${this.stackName}-loggertraking`,
      entry: path.join(__dirname, '../src/functions/cuentacvpy/loggerTraking.ts'),
      memorySize: 512,
      environment: cuentaCvPyEnv,
      ...commonFunctionProps,
      description: 'Función Lambda para logger tracking accesible vía URL directa'
    });

    // Añadir la URL directa
    const loggerTrakingUrl = loggerTrakingHandler.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      /*cors: {
        allowedOrigins: ['*'],
        // CORRECCIÓN AQUÍ: Usar los valores de string directamente
        allowedMethods: ['POST', 'OPTIONS', 'GET'] as unknown as HttpMethod[],
        allowedHeaders: ['*']
      }*/
    });

    // Añadir la salida
    new CfnOutput(this, 'LoggerTrakingUrl', {
      description: 'URL directa para loggerTraking',
      value: loggerTrakingUrl.url
    });


    const cuentaCvPyResource = api.root.addResource('Cuenta'); //CuentaCvPY

    const cuentaCvPyObtenerCuentaHandler = new NodejsFunction(this, 'CuentaCvPyObtenerCuentaFunction', {
      functionName: `${this.stackName}-cuentacvpy-obtenercuenta`,
      entry: path.join(__dirname, '../src/functions/cuentacvpy/obtenerCuenta.ts'),
      memorySize: 1024,
      environment: cuentaCvPyEnv,
      ...commonFunctionProps,
    });
    // Endpoint para obtenerCuenta
    const obtenerCuentaResource = cuentaCvPyResource.addResource('obtenerCuenta');
    obtenerCuentaResource.addMethod('GET', new LambdaIntegration(cuentaCvPyObtenerCuentaHandler), authorizerWithAuth);
    obtenerCuentaResource.addCorsPreflight(corsOptions);


    // ============================================================= COMPROBANTE CV PY API =============================================================

    const comprobanteCvPyEnv = {
      ...commonFunctionProps.environment,
      COMP_CLOUDWATCH: config.TRAN_CLOUDWATCH || process.env.TRAN_CLOUDWATCH || '',
      FORMATO_ORIGEN: 'MM/dd/yyyy HH:mm:ss',
      FORMATO_DESTINO: 'yyyy/MM/dd HH:mm'
    };

    const comprobanteCvPyResource = api.root.addResource('Comprobante');


    const consultarFirmaHandler = new NodejsFunction(this, 'ComprobanteCvPyConsultarFirmaFunction', {
      functionName: `${this.stackName}-comprobantecvpy-consultarfirma`,
      entry: path.join(__dirname, '../src/functions/comprobantecvpy/consultarFirma.ts'),
      memorySize: 512,
      environment: comprobanteCvPyEnv,
      ...commonFunctionProps,
    });

    const generarComprobanteHandler = new NodejsFunction(this, 'ComprobanteCvPyGenerarComprobanteFunction', {
      functionName: `${this.stackName}-comprobantecvpy-generarcomprobante`,
      entry: path.join(__dirname, '../src/functions/comprobantecvpy/generarComprobante.ts'),
      memorySize: 512,
      environment: comprobanteCvPyEnv,
      ...commonFunctionProps,
    });

    // Endpoint para consultarFirma
    const consultarFirmaResource = comprobanteCvPyResource.addResource('consultarFirma');
    consultarFirmaResource.addMethod('POST', new LambdaIntegration(consultarFirmaHandler), authorizerWithAuth);
    consultarFirmaResource.addCorsPreflight(corsOptions);

    // Endpoint para generarComprobante
    const generarComprobanteResource = comprobanteCvPyResource.addResource('generarComprobante');
    generarComprobanteResource.addMethod('POST', new LambdaIntegration(generarComprobanteHandler), authorizerWithAuth);
    generarComprobanteResource.addCorsPreflight(corsOptions);

    // ================================================  URL directa para generarComprobante
    const generarComprobanteUrl = generarComprobanteHandler.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE
    });

    new CfnOutput(this, 'GenerarComprobanteUrl', {
      description: 'URL directa para generarComprobante de ComprobanteCvPy',
      value: generarComprobanteUrl.url
    });

    // ================================================ URL directa para consultarFirma
    const consultarFirmaUrl = consultarFirmaHandler.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE
    });

    // OUTPUTS PARA LAS URLs DIRECTAS
      new CfnOutput(this, 'ConsultarFirmaUrl', {
        description: 'URL directa para consultarFirma de ComprobanteCvPy',
        value: consultarFirmaUrl.url
      });


    // Add CFN Outputs for important resources
    new CfnOutput(this, 'ApiUrl', {
      description: 'URL de la API Gateway',
      value: api.url
    });

    new CfnOutput(this, 'ApiKeyId', {
      description: 'ID de la API Key generada',
      value: apiKey.keyId
    });
    
  }


  private importExistingCognito(userPollId: string, resourceServerId:string, scopeName:string): { userPool: IUserPool; authScope: string } {
    // Obtener valores de la configuración
    const userPoolIdVar = userPollId || process.env.COGNITO_USER_POOL_ID || '';

    // Importar el User Pool existente
    const userPool = UserPool.fromUserPoolId(this, 'ImportedUserPool', userPoolIdVar);
    
    // Crear el scope completo para la autorización
    const authScope = `${resourceServerId}/${scopeName}`;
    
    return { userPool, authScope };
  }

}