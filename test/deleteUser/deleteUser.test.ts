import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../../src/lambdas/deleteUser/deleteUser";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

describe("deleteUser handler", () => {
  const dbMock = mockClient(DynamoDBClient);

  beforeEach(() => {
    dbMock.reset();
    process.env.TABLE_NAME = "test-table";
  });

  it("returns 400 if 'userId' query parameter is missing", async () => {
    const event = {
      queryStringParameters: {},
    } as APIGatewayProxyEvent;

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("userId is required");
  });

  it("returns 404 if user is not found in DynamoDB", async () => {
    const event = {
      queryStringParameters: { userId: "123" },
    } as unknown as APIGatewayProxyEvent;

    dbMock.on(DeleteCommand).resolves({ $metadata: { httpStatusCode: 404 } });

    const result = await handler(event);
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("User not found");
  });

  it("returns 200 if user is deleted successfully", async () => {
    const event = {
      queryStringParameters: { userId: "123" },
    } as unknown as APIGatewayProxyEvent;

    dbMock.on(DeleteCommand).resolves({ $metadata: { httpStatusCode: 200 } });

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("User deleted successfully");
  });

  it("returns 500 if DynamoDB.send throws an error", async () => {
    const event = {
      queryStringParameters: { userId: "123" },
    } as unknown as APIGatewayProxyEvent;

    dbMock.on(DeleteCommand).rejects(new Error("Dynamo error"));

    const result = await handler(event);
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Failed to delete user");
    expect(body.error).toBe("Dynamo error");
  });
});
