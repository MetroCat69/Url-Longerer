import { APIGatewayProxyResult } from "aws-lambda";
import { lambdaWrapper } from "/opt/lambdaWrapper";
import { User } from "../../types/User";
import { createRecord, createDynamoDBClient } from "/opt/dbHandler";
import { getUUID } from "/opt/uuid";
const dynamoDbClient = createDynamoDBClient();
const userTableName = process.env.USERS_TABLE_NAME!;

type CreateUserInput = Omit<User, "userId">;

const createUser = async ({
  body,
}: {
  body: CreateUserInput;
}): Promise<APIGatewayProxyResult> => {
  const userId = getUUID();
  const user = {
    ...body,
    userId,
  };

  await createRecord(
    dynamoDbClient,
    userTableName,
    user,
    "userId",
    "attribute_not_exists(userId)"
  );

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "User created successfully",
      ...user,
    }),
  };
};

export const handler = lambdaWrapper<object, CreateUserInput>(
  createUser,
  undefined,
  ["name", "email", "password"]
);
