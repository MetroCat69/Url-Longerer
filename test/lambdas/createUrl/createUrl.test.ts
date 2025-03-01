import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../../../src/lambdas/createUrl/createUrl";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

describe("createUrl handler", () => {
  const dbMock = mockClient(DynamoDBClient);

  beforeEach(() => {
    dbMock.reset();
    process.env.TABLE_NAME = "test-table";
  });

  it("returns 400 if 'domainName' query parameter is missing", async () => {
    const event = {
      queryStringParameters: {}, // no domainName provided
    } as APIGatewayProxyEvent;

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("domainName query parameter is required");
  });

  it("returns 409 if the URL already exists", async () => {
    const domainName = "example.com";
    const expectedUrl = `https://${domainName}`;
    const shortUrl = "abc123";

    const event = {
      queryStringParameters: { domainName },
    } as unknown as APIGatewayProxyEvent;

    dbMock
      .on(GetCommand)
      .resolves({ Item: { shortUrl, originalUrl: expectedUrl } });

    const result = await handler(event);

    expect(result.statusCode).toBe(409);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Short URL already exists");
    expect(body.originalUrl).toBe(expectedUrl);
  });

  it("returns 201 and creates a short URL successfully", async () => {
    const domainName = "example.com";
    const expectedUrl = `https://${domainName}`;

    const event = {
      queryStringParameters: { domainName },
    } as unknown as APIGatewayProxyEvent;

    dbMock.on(GetCommand).resolves({ Item: undefined });
    dbMock.on(PutCommand).resolves({});

    const result = await handler(event);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Short URL created successfully");
    expect(body.shortUrl).toBeDefined();
    expect(body.originalUrl).toBe(expectedUrl);
  });

  it("returns 500 if DynamoDB.send throws an error", async () => {
    const domainName = "example.com";

    const event = {
      queryStringParameters: { domainName },
    } as unknown as APIGatewayProxyEvent;
    dbMock.on(GetCommand).resolves({ Item: undefined });
    dbMock.on(PutCommand).rejects(new Error("Dynamo error"));
    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Failed to create short URL");
    expect(body.error).toBe("Dynamo error");
  });
});
