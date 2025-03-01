import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DeleteCommandInput } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const dynamoDbClient = new DynamoDBClient({});
const urlTableName = process.env.URL_TABLE_NAME!;
const userLinkTableName = process.env.USER_LINK_TABLE_NAME!;

const deleteUrlFromTable = async (
  params: DeleteCommandInput,
  tableName: string
) => {
  console.log(`Deleting URL from ${tableName}`, params);
  const result = await dynamoDbClient.send(new DeleteCommand(params));

  if (result && result.$metadata.httpStatusCode === 200) {
    console.log(`Successfully deleted URL from ${tableName}`, params);
    return true;
  } else {
    console.error(`Failed to delete URL from ${tableName}`, params);
    return false;
  }
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const shortUrl = event.queryStringParameters?.url;
  const userId = event.queryStringParameters?.userId
    ? parseInt(event.queryStringParameters.userId, 10)
    : null;

  try {
    if (!shortUrl || !userId) {
      console.error("Missing parameters", event.queryStringParameters);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "url and userId are required" }),
      };
    }

    const urlParams = {
      TableName: urlTableName,
      Key: { shortUrl },
    };

    const userLinkParams = {
      TableName: userLinkTableName,
      Key: { userId, shortUrl },
    };

    const urlDeleted = await deleteUrlFromTable(urlParams, "url table");
    const userLinkDeleted = await deleteUrlFromTable(
      userLinkParams,
      userLinkTableName
    );

    if (urlDeleted && userLinkDeleted) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "URL deleted successfully" }),
      };
    } else {
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
