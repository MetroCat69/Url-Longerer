import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  QueryCommand,
  DeleteCommandInput,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const dynamoDbClient = new DynamoDBClient({});
const urlTableName = process.env.URL_TABLE_NAME!;
const userTableName = process.env.USERS_TABLE_NAME!;
const urlGSIName = process.env.URL_GSI_NAME;
// Function to delete a URL from the specified table
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

// Function to delete a user from the user table
const deleteUserFromUserTable = async (userId: number) => {
  const userDeleteParams = {
    TableName: userTableName,
    Key: { userId },
  };
  const success = await deleteUrlFromTable(userDeleteParams, userTableName);
  return success;
};

const getUserUrls = async (userId: number) => {
  console.log(
    `getting all links of user ${userId} from table ${urlTableName} with gsi ${urlGSIName}`
  );
  const queryParams: QueryCommandInput = {
    TableName: urlTableName,
    IndexName: urlGSIName,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  };

  const queryResult = await dynamoDbClient.send(new QueryCommand(queryParams));
  console.log(`got querry result`, queryResult);
  return queryResult.Items || [];
};

const deleteUrlsFromUrlTable = async (userId: number) => {
  const userUrls = await getUserUrls(userId);

  if (userUrls.length === 0) {
    console.log(`No URLs found for userId ${userId}`);
    return true;
  }

  const deletePromises = userUrls.map((urlItem) => {
    const deleteParams = {
      TableName: urlTableName,
      Key: { urlId: urlItem.urlId },
    };
    return deleteUrlFromTable(deleteParams, urlTableName);
  });

  const deleteResults = await Promise.all(deletePromises);
  return deleteResults.every((result) => result);
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = event.queryStringParameters?.userId
    ? parseInt(event.queryStringParameters.userId, 10)
    : null;

  try {
    if (!userId) {
      console.error("Missing userId", event.queryStringParameters);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "userId is required" }),
      };
    }

    // Step 1: Delete all URLs associated with the user
    const urlsDeleted = await deleteUrlsFromUrlTable(userId);
    if (!urlsDeleted) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Failed to delete URLs" }),
      };
    }

    // Step 2: Delete the user from the user table
    const userDeleted = await deleteUserFromUserTable(userId);
    if (!userDeleted) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Failed to delete user from user table",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User and all links deleted successfully",
      }),
    };
  } catch (error) {
    console.error("Failed to delete user and links", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to delete user and links",
        error: (error as Error).message,
      }),
    };
  }
};
