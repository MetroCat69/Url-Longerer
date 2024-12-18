import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UrlMappingItem } from "../../types/UrlMappingItem";
import { createHash } from "crypto";

function simpleHash(input: string): string {
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex");
}

const dynamoDbClient = new DynamoDBClient({});
const tableName = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const originalUrl = event.queryStringParameters?.url;

    if (!originalUrl) {
      console.error("Missing url query parameter", event);
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "url query parameter is required",
          example: "?url=https://example.com",
        }),
      };
    }

    try {
      new URL(originalUrl);
    } catch (urlError) {
      console.error("Invalid URL format", urlError);
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Invalid URL format. Please provide a valid URL including protocol (http:// or https://)",
        }),
      };
    }

    const createdAt = new Date().toISOString();
    const shortUrl = simpleHash(originalUrl);

    const Item: UrlMappingItem = {
      shortUrl,
      createdAt,
      originalUrl,
      visitCount: 0,
    };

    const params = {
      TableName: tableName,
      Item: Item,
    };

    console.log("Creating URL with params", params);
    const command = new PutCommand(params);
    await dynamoDbClient.send(command);
    console.log("Created URL", params);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Short URL created successfully",
        shortUrl,
        originalUrl,
      }),
    };
  } catch (error) {
    console.error("Failed to create short URL with error", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to create short URL",
        error: (error as Error).message,
      }),
    };
  }
};
