import { APIGatewayProxyResult } from "aws-lambda";
import { lambdaWrapper } from "/opt/lambdaWrapper";
import { User } from "../../types/User";
import { createRecord, createDynamoDBClient } from "/opt/dbHandler";

const dynamoDbClient = createDynamoDBClient();
const userTableName = process.env.USERS_TABLE_NAME!;

const createUser = async ({
  body,
}: {
  body: User;
}): Promise<APIGatewayProxyResult> => {
  await createRecord(
    dynamoDbClient,
    userTableName,
    body,
    "userId",
    "attribute_not_exists(userId)"
  );

  console.log("Created user", body);

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "User created successfully",
      ...body,
    }),
  };
};

export const handler = lambdaWrapper<object, User>(createUser, undefined, [
  "userId",
  "name",
  "email",
  "password",
]);
