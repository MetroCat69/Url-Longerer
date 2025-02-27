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
      partitionKey: { name: "shortUrl", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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

    urlTable.grantWriteData(createUrlFunction);
    urlTable.grantReadData(getUrlFunction);
    urlTable.grantWriteData(deleteUrlFunction);

    const api = new apigateway.RestApi(this, "UrlShortenerApi", {
      restApiName: "URL Shortener Service",
      description: "This service handles URL shortening.",
    });

    const createResource = api.root.addResource("create");
    createResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createUrlFunction)
    );

    const getResource = api.root.addResource("get");
    getResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getUrlFunction)
    );

    const deleteResource = api.root.addResource("delete");
    deleteResource.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteUrlFunction)
    );
  }
}
