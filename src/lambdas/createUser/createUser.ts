import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { User } from "../../types/User";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";

const dynamoDbClient = new DynamoDBClient({});
const tableName = process.env.USERS_TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { userId, name, email, password } = JSON.parse(event.body || "{}");

    if (!userId || !name || !email || !password) {
      console.log("Missing required fields", event);
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "userId, name, email, and password are required",
        }),
      };
    }

    const createdAt = new Date().toISOString();
    const user: User = {
      userId,
      name,
      email,
      password,
      createdAt,
    };

    const putParams = {
      TableName: tableName,
      Item: user,
      ConditionExpression: "attribute_not_exists(userId)",
    };

    console.log("Creating user with params", putParams);
    const command = new PutCommand(putParams);
    try {
      await dynamoDbClient.send(command);
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) {
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Item already exists",
            putParams,
          }),
        };
      }
      throw err;
    }
    console.log("Created user", user);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "User created successfully",
        ...user,
      }),
    };
  } catch (error) {
    console.error("Failed to create user with error", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to create user",
        error: (error as Error).message,
      }),
    };
  }
};
