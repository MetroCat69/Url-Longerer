import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import { CdkUrlShortenerStack } from "../../cdk/lib/cdk-stack";

describe("CdkUrlShortenerStack", () => {
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new CdkUrlShortenerStack(app, "TestStack");
    template = Template.fromStack(stack);
  });

  test("should create DynamoDB tables", () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      KeySchema: [
        {
          AttributeName: "shortUrl",
          KeyType: "HASH",
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: "shortUrl",
          AttributeType: "S",
        },
        {
          AttributeName: "userId",
          AttributeType: "N",
        },
      ],
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({
          IndexName: "IndxUserId",
          KeySchema: [
            {
              AttributeName: "userId",
              KeyType: "HASH",
            },
          ],
        }),
      ]),
    });

    template.hasResourceProperties("AWS::DynamoDB::Table", {
      KeySchema: [
        {
          AttributeName: "userId",
          KeyType: "HASH",
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: "userId",
          AttributeType: "N",
        },
      ],
    });
  });

  test("should create Lambda functions", () => {
    // URL-related Lambda functions
    template.hasResourceProperties("AWS::Lambda::Function", {
      Handler: "createUrl.handler",
    });

    template.hasResourceProperties("AWS::Lambda::Function", {
      Handler: "getUrl.handler",
    });

    template.hasResourceProperties("AWS::Lambda::Function", {
      Handler: "deleteUrl.handler",
    });

    // User-related Lambda functions
    template.hasResourceProperties("AWS::Lambda::Function", {
      Handler: "createUser.handler",
    });

    template.hasResourceProperties("AWS::Lambda::Function", {
      Handler: "getUser.handler",
    });

    template.hasResourceProperties("AWS::Lambda::Function", {
      Handler: "deleteUser.handler",
    });
  });

  test("should create API Gateway with correct resources and methods", () => {
    template.hasResourceProperties("AWS::ApiGateway::RestApi", {
      Name: "URL Shortener Service",
    });

    template.hasResourceProperties("AWS::ApiGateway::Resource", {
      PathPart: "url",
    });

    template.hasResourceProperties("AWS::ApiGateway::Resource", {
      PathPart: "user",
    });

    template.hasResourceProperties("AWS::ApiGateway::Method", {
      HttpMethod: "POST",
      ResourceId: Match.anyValue(),
      RestApiId: Match.anyValue(),
    });

    template.hasResourceProperties("AWS::ApiGateway::Method", {
      HttpMethod: "GET",
      ResourceId: Match.anyValue(),
      RestApiId: Match.anyValue(),
    });

    template.hasResourceProperties("AWS::ApiGateway::Method", {
      HttpMethod: "DELETE",
      ResourceId: Match.anyValue(),
      RestApiId: Match.anyValue(),
    });
  });

  test("should create a common Lambda layer", () => {
    template.hasResourceProperties("AWS::Lambda::LayerVersion", {
      Description:
        "Layer containing common stuff like DB handler and Lambda wrapper",
    });
  });
});
