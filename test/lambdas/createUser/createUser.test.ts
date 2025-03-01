import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../../../src/lambdas/createUser/createUser";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

describe("createUser handler", () => {
  const dbMock = mockClient(DynamoDBClient);

  beforeEach(() => {
    dbMock.reset();
    process.env.TABLE_NAME = "test-table";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 400 if required fields are missing", async () => {
    const event = {} as APIGatewayProxyEvent;

    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("userId, name, email, and password are required");
  });

  it("returns 409 if the user already exists", async () => {
    const userId = "123";
    const event = {
      body: JSON.stringify({
        userId,
        name: "John Doe",
        email: "john.doe@example.com",
        password: "password123",
      }),
    } as APIGatewayProxyEvent;

    dbMock.on(GetCommand).resolves({ Item: { userId } });

    const result = await handler(event);

    expect(result.statusCode).toBe(409);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("User already exists");
  });

  it("returns 201 and creates the user successfully", async () => {
    const userId = "123";
    const event = {
      body: JSON.stringify({
        userId,
        name: "John Doe",
        email: "john.doe@example.com",
        password: "password123",
      }),
    } as APIGatewayProxyEvent;

    dbMock.on(GetCommand).resolves({ Item: undefined });
    dbMock.on(PutCommand).resolves({});

    const result = await handler(event);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("User created successfully");
    expect(body.userId).toBe(userId);
    expect(body.name).toBe("John Doe");
    expect(body.email).toBe("john.doe@example.com");
    expect(body.password).toBe("password123");
  });

  it("returns 500 if DynamoDB.send throws an error", async () => {
    const event = {
      body: JSON.stringify({
        userId: "123",
        name: "John Doe",
        email: "john.doe@example.com",
        password: "password123",
      }),
    } as APIGatewayProxyEvent;

    dbMock.on(GetCommand).resolves({ Item: undefined });
    dbMock.on(PutCommand).rejects(new Error("Dynamo error"));

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Failed to create user");
    expect(body.error).toBe("Dynamo error");
  });
});
