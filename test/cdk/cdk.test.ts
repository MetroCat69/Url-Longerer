import { Template, Match } from "aws-cdk-lib/assertions";
import { CdkUrlShortenerStack } from "../../cdk/lib/cdk-stack";
import { App } from "aws-cdk-lib";

describe("CdkUrlShortenerStack", () => {
  let app: App;
  let stack: CdkUrlShortenerStack;
  let template: Template;

  beforeAll(() => {
    app = new App();
    stack = new CdkUrlShortenerStack(app, "TestStack");
    template = Template.fromStack(stack);
  });

  test("DynamoDB Table Created", () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      AttributeDefinitions: [
        {
          AttributeName: "shortUrl",
          AttributeType: "S",
        },
      ],
      KeySchema: [
        {
          AttributeName: "shortUrl",
          KeyType: "HASH",
        },
      ],
    });
  });

  test("Lambda Functions Created with Correct Environment Variables", () => {
    ["CreateUrlFunction", "GetUrlFunction", "DeleteUrlFunction"].forEach(() => {
      template.hasResourceProperties("AWS::Lambda::Function", {
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
          },
        },
      });
    });
  });

  test("API Gateway Created with Endpoints", () => {
    template.resourceCountIs("AWS::ApiGateway::RestApi", 1);
    template.hasResourceProperties("AWS::ApiGateway::Method", {
      HttpMethod: "POST",
    });
    template.hasResourceProperties("AWS::ApiGateway::Method", {
      HttpMethod: "GET",
    });
    template.hasResourceProperties("AWS::ApiGateway::Method", {
      HttpMethod: "DELETE",
    });
  });
});
