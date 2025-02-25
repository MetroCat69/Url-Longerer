import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const dynamoDbClient = new DynamoDBClient({});
const tableName = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const shortUrl = event.queryStringParameters?.url;

  try {
    if (!shortUrl) {
      console.error(
        "missing parameter short query",
        event.queryStringParameters
      );
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "shortCode is required" }),
      };
    }

    const params = {
      TableName: tableName,
      Key: {
        shortUrl,
      },
    };

    console.log("deleting url", params);
    const command = new DeleteCommand(params);
    const result = await dynamoDbClient.send(command);

    if (result.Attributes) {
      console.log("deleted url", params);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "URL deleted successfully" }),
      };
    } else {
      console.error("URL not found");
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "URL not found" }),
      };
    }
  } catch (error) {
    console.error("Failed to delete URL", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to delete URL",
        error: (error as Error).message,
      }),
    };
  }
};
