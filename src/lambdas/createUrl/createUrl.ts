import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UrlMappingItem } from "../../types/UrlMappingItem";
import { createHash } from "crypto";

function simpleHash(input: string): string {
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex");
}

const dynamoDbClient = new DynamoDBClient({});
const urlTableName = process.env.URL_TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const domainName = event.queryStringParameters?.domainName;
    const userId = event.queryStringParameters?.userId
      ? parseInt(event.queryStringParameters.userId)
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

    const urlMappingItem: UrlMappingItem = {
      shortUrl,
      userId,
      createdAt,
      originalUrl,
      visitCount: 0,
    };

    const putParams = {
      TableName: urlTableName,
      Item: urlMappingItem,
      ConditionExpression: "attribute_not_exists(shortUrl)",
    };

    console.log("Creating URL with params", putParams);
    const command = new PutCommand(putParams);
    try {
      const ans = await dynamoDbClient.send(command);
      console.log(ans);
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
