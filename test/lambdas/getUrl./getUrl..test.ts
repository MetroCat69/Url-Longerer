import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../../../src/lambdas/getUrl/getUrl";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

describe("getUrl handler", () => {
  const dbMock = mockClient(DynamoDBClient);

  beforeEach(() => {
    dbMock.reset();
    process.env.TABLE_NAME = "test-table";
  });

  it("returns 400 if 'shortUrl' query parameter is missing", async () => {
    const event = {
      queryStringParameters: {}, // missing shortUrl
    } as APIGatewayProxyEvent;

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("shortCode is required");
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

  it("returns 200 and the item if found", async () => {
    const event = {
      queryStringParameters: { url: "abc123" },
    } as unknown as APIGatewayProxyEvent;

    const item = {
      shortUrl: "abc123",
      originalUrl: "https://example.com",
      createdAt: new Date().toISOString(),
      visitCount: 0,
    };

    dbMock.on(GetCommand).resolves({ Item: item });

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toEqual(item);
  });

  it("returns 500 if DynamoDB.send throws an error", async () => {
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
});
