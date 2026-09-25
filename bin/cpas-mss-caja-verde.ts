#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { CpasMssCajaVerdeStack } from '../lib/cpas-mss-caja-verde-stack';
import { BuildConfiguration } from '../config/BuildConfiguration';

const app = new App();

const nameStackApplication = `cpas-mss-caja-verde`;

const Main = async (app: any) => {

  const stage = app.node.tryGetContext("stage") || "dev";
  const region = app.node.tryGetContext("region") || "us-east-1";

  // call to configuration and systemManager
  const buildConfig = new BuildConfiguration(nameStackApplication, stage);
  const config: any = await buildConfig.getConfig();

  try {
    new CpasMssCajaVerdeStack(app, `${nameStackApplication}-${stage}`, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: region
      },
      tags: config
    });
  } catch (e) {
    console.error(e);
  }
  app.synth();
}

Main(app);