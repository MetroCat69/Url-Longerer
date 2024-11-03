import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";

export class CdkHelloWorldStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const helloWorldFunction = new lambda.Function(this, "HelloWorldFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("dist/src/lambdas/hello"),
      handler: "hello.handler",
    });

    const api = new apigateway.LambdaRestApi(this, "HelloWorldApi", {
      handler: helloWorldFunction,
      proxy: false,
    });

    const helloResource = api.root.addResource("hello");
    helloResource.addMethod("GET");
  }
}
