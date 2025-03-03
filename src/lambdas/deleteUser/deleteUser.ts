import { APIGatewayProxyResult } from "aws-lambda";
import {
  deleteRecord,
  queryDb,
  createDynamoDBClient,
} from "../../common/dbHandler";
import { lambdaWrapper } from "../../common/lambdaWrapper";

const dynamoDbClient = createDynamoDBClient();
const urlTableName = process.env.URL_TABLE_NAME!;
const userTableName = process.env.USERS_TABLE_NAME!;
const urlGSIName = process.env.URL_GSI_NAME;

export interface DeleteUserInput {
  userId: number;
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

  const userUrls = await queryDb(dynamoDbClient, queryParams);

  if (userUrls.length === 0) {
    console.log(`No URLs found for userId ${userId}`);
    return;
  }

  const deletePromises = userUrls.map((urlItem) => {
    const deleteParams = {
      TableName: urlTableName,
      Key: { urlId: urlItem.urlId },
    };
    return deleteRecord(dynamoDbClient, urlTableName, deleteParams.Key);
  });
  console.log("deleting user urls");
  await Promise.all(deletePromises);
};

const deleteUserFromUserTable = async (userId: number) => {
  const userDeleteParams = {
    TableName: userTableName,
    Key: { userId },
  };
  return await deleteRecord(
    dynamoDbClient,
    userTableName,
    userDeleteParams.Key
  );
};

const deleteUser = async (
  validatedBody: DeleteUserInput
): Promise<APIGatewayProxyResult> => {
  const { userId } = validatedBody;

  await deleteUrlsFromUrlTable(userId);
  await deleteUserFromUserTable(userId);

  console.log("Deleted user", userId);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "User and all links deleted successfully",
    }),
  };
};

export const handler = lambdaWrapper<{ userId: number }>(
  ["userId"],
  deleteUser
);
