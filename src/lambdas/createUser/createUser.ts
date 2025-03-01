import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { User } from "../../types/User";

const dynamoDbClient = new DynamoDBClient({});
const usersTableName = process.env.USERS_TABLE_NAME!;
//const userLinssTableName = process.env.USERS_LINKS_TABLE_NAME!;

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

    const getParams = {
      TableName: usersTableName,
      Key: { userId },
    };
    const getCommand = new GetCommand(getParams);
    console.log("Checking if URL already exists", getParams);
    const existingUser = await dynamoDbClient.send(getCommand);
    console.log("Existing Users", existingUser);

    if (existingUser.Item) {
      console.log("User already exists", event);
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: "User already exists",
          userId,
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
      TableName: usersTableName,
      Item: user,
    };

    console.log("Creating user with params", putParams);
    const putCommand = new PutCommand(putParams);
    await dynamoDbClient.send(putCommand);
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
