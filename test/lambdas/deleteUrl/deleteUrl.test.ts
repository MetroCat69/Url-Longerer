import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../../../src/lambdas/deleteUrl/deleteUrl";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

describe("deleteUrl handler", () => {
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

  it("returns 404 if URL is not found in DynamoDB", async () => {
    const event = {
      queryStringParameters: { url: "abc123" },
    } as unknown as APIGatewayProxyEvent;

    dbMock.on(DeleteCommand).resolves({ Attributes: undefined });

    const result = await handler(event);
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("URL not found");
  });

  it("returns 200 if URL is deleted successfully", async () => {
    const event = {
      queryStringParameters: { url: "abc123" },
    } as unknown as APIGatewayProxyEvent;

    dbMock.on(DeleteCommand).resolves({ Attributes: { deleted: true } });

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("URL deleted successfully");
  });

  it("returns 500 if DynamoDB.send throws an error", async () => {
    const event = {
      queryStringParameters: { url: "abc123" },
    } as unknown as APIGatewayProxyEvent;

    dbMock.on(DeleteCommand).rejects(new Error("Dynamo error"));

    const result = await handler(event);
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Failed to delete URL");
    expect(body.error).toBe("Dynamo error");
  });
});
