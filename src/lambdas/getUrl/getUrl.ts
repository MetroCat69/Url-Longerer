import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UrlMappingItem } from "../../types/UrlMappingItem";

const dynamoDbClient = new DynamoDBClient({});
const tableName = process.env.TABLE_NAME!;
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const shortUrl = event.queryStringParameters?.url;
    if (!shortUrl) {
      console.error(
        "missing parameter short query",
        event.queryStringParameters
      );
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "URL is required" }),
      };
    }

    const params = {
      TableName: tableName,
      Key: {
        shortUrl,
      },
    };
    console.log("getting url", params);
    const command = new GetCommand(params);
    const result = await dynamoDbClient.send(command);
    const item = result.Item as UrlMappingItem;

    if (!item) {
      console.error("URL not found for code", shortUrl);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "URL not found" }),
      };
    }

    console.log("got url", item);

    const updateParams = {
      TableName: tableName,
      Key: { shortUrl },
      UpdateExpression: "SET visitCount = visitCount + :inc",
      ExpressionAttributeValues: { ":inc": 1 },
    };

    console.log("incramented url visited count with params", updateParams);

    const updateCommand = new UpdateCommand(updateParams);
    await dynamoDbClient.send(updateCommand);

    return {
      statusCode: 301,
      headers: {
        Location: item.originalUrl,
      },
      body: "",
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
