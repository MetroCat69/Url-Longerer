import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const dynamoDbClient = new DynamoDBClient({});
const tableName = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = event.queryStringParameters?.userId;

  try {
    if (!userId) {
      console.error("missing parameter userId", event.queryStringParameters);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "userId is required" }),
      };
    }

    const params = {
      TableName: tableName,
      Key: {
        userId,
      },
    };

    console.log("deleting user", params);
    const command = new DeleteCommand(params);
    const result = await dynamoDbClient.send(command);

    if (result && result.$metadata.httpStatusCode === 200) {
      console.log("deleted user", params);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "User deleted successfully" }),
      };
    } else {
      console.error("User not found");
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }
  } catch (error) {
    console.error("Failed to delete user", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to delete user",
        error: (error as Error).message,
      }),
    };
  }
};
