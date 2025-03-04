import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { getRecord } from "/opt/dbHandler";
import { lambdaWrapper } from "/opt/lambdaWrapper";
import { User } from "../../types/User";

const dynamoDbClient = new DynamoDBClient({});
const userTableName = process.env.USERS_TABLE_NAME!;

export interface GetUserQueryParams {
  userId: string;
}

const getUserHandler = async ({
  queryParams,
}: {
  queryParams: GetUserQueryParams;
}): Promise<APIGatewayProxyResult> => {
  const { userId } = queryParams;
  const userIdInt = parseInt(userId, 10);

  console.log("Fetching user with key:", { userIdInt });

  const user = (await getRecord(dynamoDbClient, userTableName, {
    userId: userIdInt,
  })) as User;

  if (!user) {
    console.error("User not found for userId:", { userId: userIdInt });
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "User not found" }),
    };
  }

  console.log("Retrieved user:", user);

  return {
    statusCode: 200,
    body: JSON.stringify({
      ...user,
      password: undefined,
    }),
  };
};

export const handler = lambdaWrapper<GetUserQueryParams, object>(
  getUserHandler,
  ["userId"]
);
