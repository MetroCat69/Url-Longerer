import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import * as path from "path";

const lambdaPath = "dist/src/lambdas/";

export class CdkUrlShortenerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const urlTable = new dynamodb.Table(this, "UrlTable", {
      tableName: "UrlTable",
      partitionKey: { name: "shortUrl", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userTable = new dynamodb.Table(this, "UserTable", {
      tableName: "UserTable",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const api = new apigateway.RestApi(this, "UrlShortenerApi", {
      restApiName: "URL Shortener Service",
      description: "This service handles URL shortening.",
    });

    const createUrlFunction = new lambda.Function(this, "CreateUrlFunction", {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset(path.join(lambdaPath, "createUrl")),
      handler: "createUrl.handler",
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: urlTable.tableName,
      },
    });

    const getUrlFunction = new lambda.Function(this, "GetUrlFunction", {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset(path.join(lambdaPath, "getUrl")),
      handler: "getUrl.handler",
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: urlTable.tableName,
      },
    });

    const deleteUrlFunction = new lambda.Function(this, "DeleteUrlFunction", {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset(path.join(lambdaPath, "deleteUrl")),
      handler: "deleteUrl.handler",
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: urlTable.tableName,
      },
    });

    urlTable.grantReadWriteData(createUrlFunction);
    urlTable.grantReadWriteData(getUrlFunction);
    urlTable.grantWriteData(deleteUrlFunction);

    const urlResource = api.root.addResource("url");

    urlResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createUrlFunction)
    );

    urlResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getUrlFunction)
    );

    urlResource.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteUrlFunction)
    );

    const createUserFunction = new lambda.Function(this, "CreateUserFunction", {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset(path.join(lambdaPath, "createUser")),
      handler: "createUser.handler",
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: userTable.tableName,
      },
    });

    const deleteUserFunction = new lambda.Function(this, "DeleteUserFunction", {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset(path.join(lambdaPath, "deleteUser")),
      handler: "deleteUser.handler",
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: userTable.tableName,
      },
    });

    userTable.grantReadWriteData(createUserFunction);
    urlTable.grantWriteData(deleteUserFunction);

    const userResource = api.root.addResource("url");

    userResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createUserFunction)
    );

    urlResource.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteUserFunction)
    );
  }
}
