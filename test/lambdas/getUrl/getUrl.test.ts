import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../../../src/lambdas/getUrl/getUrl";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

describe("getUrl handler", () => {
  const dbMock = mockClient(DynamoDBClient);

  beforeEach(() => {
    jest.resetModules();
    dbMock.reset();
  });

  it("returns 400 if 'url' query parameter is missing", async () => {
    const event = {
      queryStringParameters: {}, // missing shortUrl
    } as APIGatewayProxyEvent;

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("URL is required");
  });

  it("returns 404 if no item is found in DynamoDB", async () => {
    const event = {
      queryStringParameters: { url: "abc123" },
    } as unknown as APIGatewayProxyEvent;

    dbMock.on(GetCommand).resolves({ Item: undefined });
    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("URL not found");
  });

  it("returns 301 redirect to the original URL and increments visit count", async () => {
    const event = {
      queryStringParameters: { url: "abc123" },
    } as unknown as APIGatewayProxyEvent;

    const originalUrl = "https://example.com";
    const item = {
      shortUrl: "abc123",
      originalUrl,
      createdAt: new Date().toISOString(),
      visitCount: 0,
    };

    dbMock.on(GetCommand).resolves({ Item: item });
    dbMock.on(UpdateCommand).resolves({});

    const result = await handler(event);

    expect(result.statusCode).toBe(301);
    expect(result.headers).toHaveProperty("Location", originalUrl);
    expect(result.body).toBe("");

    // Verify that the update command was called with the correct parameters
    const updateCalls = dbMock.commandCalls(UpdateCommand);
    expect(updateCalls.length).toBe(1);

    const updateCall = updateCalls[0];
    const updateParams = updateCall.args[0].input;
    expect(updateParams.Key).toEqual({ shortUrl: "abc123" });
    expect(updateParams.UpdateExpression).toBe(
      "SET visitCount = visitCount + :inc"
    );
    expect(updateParams.ExpressionAttributeValues).toEqual({ ":inc": 1 });
  });

  it("returns 500 if GetCommand throws an error", async () => {
    const event = {
      queryStringParameters: { url: "abc123" },
    } as unknown as APIGatewayProxyEvent;

    dbMock.on(GetCommand).rejects(new Error("Dynamo error"));
    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Failed to retrieve URL");
    expect(body.error).toBe("Dynamo error");
  });

  it("returns 500 if UpdateCommand throws an error", async () => {
    const event = {
      queryStringParameters: { url: "abc123" },
    } as unknown as APIGatewayProxyEvent;

    const originalUrl = "https://example.com";
    const item = {
      shortUrl: "abc123",
      originalUrl,
      createdAt: new Date().toISOString(),
      visitCount: 0,
    };

    dbMock.on(GetCommand).resolves({ Item: item });
    dbMock.on(UpdateCommand).rejects(new Error("Update error"));

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Failed to retrieve URL");
    expect(body.error).toBe("Update error");
  });
});
