import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UrlMappingItem } from "../../types/UrlMappingItem";

const dynamoDbClient = new DynamoDBClient({
  endpoint: "http://localhost:4566",
});
const tableName = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { shortCode } = event.queryStringParameters || {};

    if (!shortCode) {
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
        shortCode,
      },
    };

    console.log("getting url", params);
    const command = new GetCommand(params);
    const result = await dynamoDbClient.send(command);
    const item = result.Item as UrlMappingItem;

    if (!item) {
      console.error("URL not found for code", shortCode);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "URL not found" }),
      };
    }

    console.log("got url", item);
    return {
      statusCode: 200,
      body: JSON.stringify(item),
    };
  } catch (error) {
    console.error("Failed to retrieve URL with error", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to retrieve URL",
        error: (error as Error).message,
      }),
    };
  }
};
