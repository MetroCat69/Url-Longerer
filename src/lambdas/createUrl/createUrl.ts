import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { CreateShortUrlRequest } from "../../types/CreateShortUrlRequest";
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
    if (!event.body) {
      console.error("Missing body in event", event);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Request body is required." }),
      };
    }

    let body: CreateShortUrlRequest;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      console.error("Failed to parse request body", parseError);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid JSON format." }),
      };
    }

    const { originalUrl } = body;
    if (!originalUrl) {
      console.error("Missing originalUrl in request");
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "originalUrl is required",
        }),
      };
    }

    const createdAt = new Date().toISOString();
    const shortCode = simpleHash(originalUrl);
    const Item: UrlMappingItem = {
      shortCode,
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
        shortCode,
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
