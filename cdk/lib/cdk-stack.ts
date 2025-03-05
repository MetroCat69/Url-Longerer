import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager"; // Import Secrets Manager
import { Construct } from "constructs";
import * as path from "path";

const lambdaPath = "dist/src/lambdas/";
const layerPath = "dist/src";

export class CdkUrlShortenerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const secret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "RedisCredentials",
      "RedisCredentialsNew"
    );

    const urlTable = new dynamodb.Table(this, "UrlTable", {
      tableName: "UrlTable",
      partitionKey: { name: "shortUrl", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const urlGSIName = "IndxUserId";
    urlTable.addGlobalSecondaryIndex({
      indexName: urlGSIName,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.NUMBER },
    });

    const userTable = new dynamodb.Table(this, "UserTable", {
      tableName: "UserTable",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const commonLayer = new lambda.LayerVersion(this, "commonLayer", {
      code: lambda.Code.fromAsset(path.join(layerPath, "common")),
      compatibleRuntimes: [lambda.Runtime.NODEJS_LATEST],
      description:
        "Layer containing common stuff like DB handler and Lambda wrapper",
    });

    const api = new apigateway.RestApi(this, "UrlShortenerApi", {
      restApiName: "URL Shortener Service",
      description: "This service handles URL shortening.",
    });

    const urlResource = api.root.addResource("url");
    const userResource = api.root.addResource("user");

    const createUrlFunction = new lambda.Function(this, "CreateUrlFunction", {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset(path.join(lambdaPath, "createUrl")),
      handler: "createUrl.handler",
      timeout: cdk.Duration.seconds(10),
      layers: [commonLayer],
      environment: {
        URL_TABLE_NAME: urlTable.tableName,
        REDIS_HOST: secret.secretValueFromJson("REDIS_HOST").unsafeUnwrap(),
        REDIS_PORT: secret.secretValueFromJson("REDIS_PORT").unsafeUnwrap(),
        REDIS_PASSWORD: secret
          .secretValueFromJson("REDIS_PASSWORD")
          .unsafeUnwrap(),
      },
    });

    secret.grantRead(createUrlFunction);
    urlTable.grantReadWriteData(createUrlFunction);
    urlResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createUrlFunction)
    );

    const getUrlFunction = new lambda.Function(this, "GetUrlFunction", {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset(path.join(lambdaPath, "getUrl")),
      handler: "getUrl.handler",
      timeout: cdk.Duration.seconds(10),
      layers: [commonLayer],
      environment: {
        URL_TABLE_NAME: urlTable.tableName,
        REDIS_HOST: secret.secretValueFromJson("REDIS_HOST").unsafeUnwrap(),
        REDIS_PORT: secret.secretValueFromJson("REDIS_PORT").unsafeUnwrap(),
        REDIS_PASSWORD: secret
          .secretValueFromJson("REDIS_PASSWORD")
          .unsafeUnwrap(),
      },
    });
    secret.grantRead(getUrlFunction);
    urlTable.grantReadWriteData(getUrlFunction);
    urlResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getUrlFunction)
    );

    const deleteUrlFunction = new lambda.Function(this, "DeleteUrlFunction", {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset(path.join(lambdaPath, "deleteUrl")),
      handler: "deleteUrl.handler",
      timeout: cdk.Duration.seconds(10),
      layers: [commonLayer],
      environment: {
        URL_TABLE_NAME: urlTable.tableName,
        REDIS_HOST: secret.secretValueFromJson("REDIS_HOST").unsafeUnwrap(),
        REDIS_PORT: secret.secretValueFromJson("REDIS_PORT").unsafeUnwrap(),
        REDIS_PASSWORD: secret
          .secretValueFromJson("REDIS_PASSWORD")
          .unsafeUnwrap(),
      },
    });
    urlTable.grantWriteData(deleteUrlFunction);
    urlResource.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteUrlFunction)
    );

    const createUserFunction = new lambda.Function(this, "CreateUserFunction", {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset(path.join(lambdaPath, "createUser")),
      handler: "createUser.handler",
      timeout: cdk.Duration.seconds(10),
      layers: [commonLayer],
      environment: {
        USERS_TABLE_NAME: userTable.tableName,
      },
    });
    userTable.grantReadWriteData(createUserFunction);
    userResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createUserFunction)
    );

    const getUserFunction = new lambda.Function(this, "GetUserFunction", {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset(path.join(lambdaPath, "getUser")),
      handler: "getUser.handler",
      timeout: cdk.Duration.seconds(10),
      layers: [commonLayer],
      environment: {
        USERS_TABLE_NAME: userTable.tableName,
      },
    });
    userTable.grantReadData(getUserFunction);
    userResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getUserFunction)
    );

    const deleteUserFunction = new lambda.Function(this, "DeleteUserFunction", {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset(path.join(lambdaPath, "deleteUser")),
      handler: "deleteUser.handler",
      timeout: cdk.Duration.seconds(10),
      layers: [commonLayer],
      environment: {
        USERS_TABLE_NAME: userTable.tableName,
        URL_TABLE_NAME: urlTable.tableName,
        URL_GSI_NAME: urlGSIName,
        REDIS_HOST: secret.secretValueFromJson("REDIS_HOST").unsafeUnwrap(),
        REDIS_PORT: secret.secretValueFromJson("REDIS_PORT").unsafeUnwrap(),
        REDIS_PASSWORD: secret
          .secretValueFromJson("REDIS_PASSWORD")
          .unsafeUnwrap(),
      },
    });
    userTable.grantWriteData(deleteUserFunction);
    urlTable.grantReadWriteData(deleteUserFunction);
    userResource.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteUserFunction)
    );
  }
}
