import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../../../src/lambdas/deleteUser/deleteUser";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

describe("deleteUser handler", () => {
  const dbMock = mockClient(DynamoDBClient);

  beforeEach(() => {
    dbMock.reset();
    process.env.URL_TABLE_NAME = "test-url-table";
    process.env.USER_LINK_TABLE_NAME = "test-user-link-table";
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

  it("returns 404 if no links found for user", async () => {
    const event = {
      queryStringParameters: { userId: "123" },
    } as unknown as APIGatewayProxyEvent;

    dbMock
      .on(GetCommand, {
        TableName: "test-user-link-table",
        Key: { userId: 123 },
      })
      .resolves({ Item: undefined });

    const result = await handler(event);
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("No links found for user");
  });

  it("returns 404 if deletion of user links fails", async () => {
    const event = {
      queryStringParameters: { userId: "123" },
    } as unknown as APIGatewayProxyEvent;

    dbMock
      .on(GetCommand, {
        TableName: "test-user-link-table",
        Key: { userId: 123 },
      })
      .resolves({ Item: { links: ["abc123"] } });
    dbMock
      .on(DeleteCommand, {
        TableName: "test-user-link-table",
        Key: { userId: 123, shortUrl: "abc123" },
      })
      .resolves({ $metadata: { httpStatusCode: 404 } });

    const result = await handler(event);
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Failed to delete user links");
  });

  it("returns 404 if deletion of URLs fails", async () => {
    const event = {
      queryStringParameters: { userId: "123" },
    } as unknown as APIGatewayProxyEvent;

    dbMock
      .on(GetCommand, {
        TableName: "test-user-link-table",
        Key: { userId: 123 },
      })
      .resolves({ Item: { links: ["abc123"] } });
    dbMock
      .on(DeleteCommand, {
        TableName: "test-user-link-table",
        Key: { userId: 123, shortUrl: "abc123" },
      })
      .resolves({ $metadata: { httpStatusCode: 200 } });
    dbMock
      .on(DeleteCommand, {
        TableName: "test-url-table",
        Key: { shortUrl: "abc123" },
      })
      .resolves({ $metadata: { httpStatusCode: 404 } });

    const result = await handler(event);
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Failed to delete URLs");
  });

  it("returns 404 if deletion of user fails", async () => {
    const event = {
      queryStringParameters: { userId: "123" },
    } as unknown as APIGatewayProxyEvent;

    dbMock
      .on(GetCommand, {
        TableName: "test-user-link-table",
        Key: { userId: 123 },
      })
      .resolves({ Item: { links: ["abc123"] } });

    dbMock
      .on(DeleteCommand, {
        TableName: "test-user-link-table",
        Key: { userId: 123, shortUrl: "abc123" },
      })
      .resolves({ $metadata: { httpStatusCode: 200 } });
    dbMock
      .on(DeleteCommand, {
        TableName: "test-url-table",
        Key: { shortUrl: "abc123" },
      })
      .resolves({ $metadata: { httpStatusCode: 200 } });
    dbMock
      .on(DeleteCommand, {
        TableName: "test-user-link-table",
        Key: { userId: 123 },
      })
      .resolves({ $metadata: { httpStatusCode: 404 } });

    const result = await handler(event);
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Failed to delete user");
  });

  it("returns 200 if user and all links are deleted successfully", async () => {
    const event = {
      queryStringParameters: { userId: "123" },
    } as unknown as APIGatewayProxyEvent;

    dbMock
      .on(GetCommand, {
        TableName: "test-user-link-table",
        Key: { userId: 123 },
      })
      .resolves({ Item: { links: ["abc123"] } });
    dbMock
      .on(DeleteCommand, {
        TableName: "test-user-link-table",
        Key: { userId: 123, shortUrl: "abc123" },
      })
      .resolves({ $metadata: { httpStatusCode: 200 } });
    dbMock
      .on(DeleteCommand, {
        TableName: "test-url-table",
        Key: { shortUrl: "abc123" },
      })
      .resolves({ $metadata: { httpStatusCode: 200 } });
    dbMock
      .on(DeleteCommand, {
        TableName: "test-user-link-table",
        Key: { userId: 123 },
      })
      .resolves({ $metadata: { httpStatusCode: 200 } });

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("User and all links deleted successfully");
  });

  it("returns 404 if DynamoDB.send throws an error", async () => {
    const event = {
      queryStringParameters: { userId: "123" },
    } as unknown as APIGatewayProxyEvent;

    // Force an error for the GetCommand call
    dbMock.on(GetCommand).rejects(new Error("Dynamo error"));

    const result = await handler(event);
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Failed to delete user and links");
    expect(body.error).toBe("Dynamo error");
  });
});
