import { APIGatewayProxyResult } from "aws-lambda";
import { deleteRecord, queryDb, createDynamoDBClient } from "/opt/dbHandler";
import { lambdaWrapper } from "/opt/lambdaWrapper";
import { UrlRecord } from "../../types/UrlRecord";
import {
  getRedisClient,
  connectRedisClient,
  redisDelete,
} from "/opt/redisHandler";

const dynamoDbClient = createDynamoDBClient();
const urlTableName = process.env.URL_TABLE_NAME!;
const userTableName = process.env.USERS_TABLE_NAME!;
const urlGSIName = process.env.URL_GSI_NAME;

export interface DeleteUserQueryParams {
  userId: string;
}

const deleteUrlsFromUrlTable = async (userId: number) => {
  const queryParams = {
    TableName: urlTableName,
    IndexName: urlGSIName,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  };

  const redisClient = await getRedisClient();
  await connectRedisClient(redisClient);

  const userUrls: UrlRecord[] = await queryDb(dynamoDbClient, queryParams);
  if (userUrls.length === 0) {
    console.log(`No URLs found for userId ${userId}`);
    await redisClient.quit();
    return;
  }

  const deletePromises = userUrls.map(async (urlItem) => {
    await deleteRecord(dynamoDbClient, urlTableName, {
      shortUrl: urlItem.shortUrl,
    });
    await redisDelete(redisClient, urlItem.shortUrl);
    console.log("Deleted from Redis:", urlItem.shortUrl);
  });

  console.log("Deleting user URLs from DynamoDB and Redis...");
  await Promise.all(deletePromises);

  await redisClient.quit();
};

const deleteUserFromUserTable = async (userId: number) => {
  return await deleteRecord(dynamoDbClient, userTableName, { userId });
};

const deleteUser = async ({
  queryParams,
}: {
  queryParams: DeleteUserQueryParams;
}): Promise<APIGatewayProxyResult> => {
  const { userId } = queryParams;
  const userIdInt = parseInt(userId, 10);

  await deleteUrlsFromUrlTable(userIdInt);
  await deleteUserFromUserTable(userIdInt);

  console.log("Deleted user", userIdInt);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "User and all links deleted successfully",
    }),
  };
};

export const handler = lambdaWrapper<DeleteUserQueryParams, object>(
  deleteUser,
  ["userId"]
);
