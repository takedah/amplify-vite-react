import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import {
  Runtime,
  AgentRuntimeArtifact,
  RuntimeAuthorizerConfiguration,
} from '@aws-cdk/aws-bedrock-agentcore-alpha';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const backend = defineBackend({ auth });

const { userPool, userPoolClient } = backend.auth.resources;

const agentStack = backend.createStack('AgentStack');

const agentRuntime = new Runtime(agentStack, 'AgentRuntime', {
  runtimeName: 'AwsNewsAgent',
  agentRuntimeArtifact: AgentRuntimeArtifact.fromAsset(
    path.join(__dirname, 'agent')
  ),
  authorizerConfiguration: RuntimeAuthorizerConfiguration.usingCognito(
    userPool,
    [userPoolClient]
  ),
  description: 'AWS News Agent powered by Strands + Claude Haiku',
});

agentRuntime.role.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
    resources: [
      'arn:aws:bedrock:*::foundation-model/*',
      'arn:aws:bedrock:*:*:inference-profile/*',
    ],
  })
);

backend.addOutput({
  custom: {
    agentRuntimeArn: agentRuntime.agentRuntimeArn,
  },
});
