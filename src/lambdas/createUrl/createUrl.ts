import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
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
    const domainName = event.queryStringParameters?.domainName;

    if (!domainName) {
      console.error("Missing domainName query parameter", event);
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "domainName query parameter is required",
        }),
      };
    }

    const originalUrl = `https://${domainName}`;

    const createdAt = new Date();
    const shortUrl = simpleHash(originalUrl);

    // Check if the URL already exists
    const getParams = {
      TableName: tableName,
      Key: { shortUrl },
    };

    console.log("Checking if URL already exists", getParams);
    const getCommand = new GetCommand(getParams);
    const existingItem = await dynamoDbClient.send(getCommand);
    console.log("Existing Items", existingItem);

    if (existingItem.Item) {
      console.log("URL already exists", existingItem.Item);
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: "Short URL already exists",
          shortUrl,
          originalUrl,
        }),
      };
    }

    const item: UrlMappingItem = {
      shortUrl,
      createdAt,
      originalUrl,
      visitCount: 0,
    };

    const putParams = {
      TableName: tableName,
      Item: item,
    };

    console.log("Creating URL with params", putParams);
    const command = new PutCommand(putParams);
    await dynamoDbClient.send(command);
    console.log("Created URL", putParams);

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
