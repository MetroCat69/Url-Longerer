import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../../../src/lambdas/createUrl/createUrl";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

describe("createUrl handler", () => {
  const dbMock = mockClient(DynamoDBClient);

  beforeEach(() => {
    dbMock.reset();
    process.env.TABLE_NAME = "test-table";
  });

  it("returns 400 if 'url' query parameter is missing", async () => {
    const event = {
      queryStringParameters: {}, // no url provided
    } as APIGatewayProxyEvent;

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("url query parameter is required");
  });

  it("returns 400 if the provided URL is invalid", async () => {
    const event = {
      queryStringParameters: { url: "not-a-valid-url" },
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toMatch(/Invalid URL format/);
  });

  it("returns 201 and creates a short URL successfully", async () => {
    const validUrl = "https://example.com";
    const event = {
      queryStringParameters: { url: validUrl },
    } as unknown as APIGatewayProxyEvent;

    dbMock.on(PutCommand).resolves({});

    const result = await handler(event);
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Short URL created successfully");
    expect(body.shortUrl).toBeDefined();
    expect(body.originalUrl).toBe(validUrl);
  });

  it("returns 500 if DynamoDB.send throws an error", async () => {
    const validUrl = "https://example.com";
    const event = {
      queryStringParameters: { url: validUrl },
    } as unknown as APIGatewayProxyEvent;

    dbMock.on(PutCommand).rejects(new Error("Dynamo error"));

    const result = await handler(event);
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Failed to create short URL");
    expect(body.error).toBe("Dynamo error");
  });
});
