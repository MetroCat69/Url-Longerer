import { APIGatewayProxyResult } from "aws-lambda";
import { lambdaWrapper } from "/opt/lambdaWrapper";
import { User } from "../../types/User";
import { createRecord, createDynamoDBClient } from "/opt/dbHandler";

const dynamoDbClient = createDynamoDBClient();
const userTableName = process.env.USERS_TABLE_NAME!;

const createUser = async (user: User): Promise<APIGatewayProxyResult> => {
  await createRecord(dynamoDbClient, userTableName, user, "userId");

  console.log("Created user", user);

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "User created successfully",
      ...user,
    }),
  };
};

export const handler = lambdaWrapper<User>(
  ["userId", "name", "email", "password"],
  createUser
);
