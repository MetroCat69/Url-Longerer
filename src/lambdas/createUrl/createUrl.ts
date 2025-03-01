import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UrlMappingItem } from "../../types/UrlMappingItem";
import { UserLinkConnection } from "../../types/UserLinkConnection";
import { createHash } from "crypto";

function simpleHash(input: string): string {
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex");
}

const dynamoDbClient = new DynamoDBClient({});
const urlTableName = process.env.URL_TABLE_NAME!;
const userLinkTableName = process.env.USER_LINK_TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const domainName = event.queryStringParameters?.domainName;
    const userId = event.queryStringParameters?.userId
      ? parseInt(event.queryStringParameters.userId, 10)
      : null;

    if (!domainName || !userId) {
      console.error("Missing required query parameters", event);
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "domainName and userId query parameters are required",
        }),
      };
    }

    const originalUrl = `https://${domainName}`;
    const createdAt = new Date().toISOString();
    const shortUrl = simpleHash(originalUrl);

    // Check if the URL already exists
    const getParams = {
      TableName: urlTableName,
      Key: { shortUrl },
    };

    console.log("Checking if URL already exists", getParams);
    const getCommand = new GetCommand(getParams);
    const existingItem = await dynamoDbClient.send(getCommand);
    console.log("Existing Items", existingItem);

    if (existingItem.Item) {
      console.error("URL already exists", existingItem.Item);
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: "Short URL already exists",
          shortUrl,
          originalUrl,
        }),
      };
    }

    const userUrlLink: UserLinkConnection = {
      userId,
      shortUrl,
    };
    // Add entry to user link table
    const userLinkParams = {
      TableName: userLinkTableName,
      Item: userUrlLink,
    };

    console.log("Adding URL to user link table", userLinkParams);
    const userLinkCommand = new PutCommand(userLinkParams);
    await dynamoDbClient.send(userLinkCommand);
    console.log("Added URL to user link table", userLinkParams);

    // add url to url table
    const urlMappingItem: UrlMappingItem = {
      shortUrl,
      createdAt,
      originalUrl,
      visitCount: 0,
    };

    const putParams = {
      TableName: urlTableName,
      Item: urlMappingItem,
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
