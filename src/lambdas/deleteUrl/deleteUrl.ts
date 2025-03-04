import { APIGatewayProxyResult } from "aws-lambda";
import { lambdaWrapper } from "/opt/lambdaWrapper";
import { deleteRecord, createDynamoDBClient } from "/opt/dbHandler";

const dynamoDbClient = createDynamoDBClient();
const urlTableName = process.env.URL_TABLE_NAME!;

export interface DeleteUrlQueryParams {
  userId: number;
  url: string;
}

const deleteUrl = async ({
  queryParams,
}: {
  queryParams: DeleteUrlQueryParams;
}): Promise<APIGatewayProxyResult> => {
  const { userId, url } = queryParams;

  await deleteRecord(dynamoDbClient, urlTableName, { shortUrl: url });

  console.log("Deleted url", url, "for user", userId);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "URL deleted successfully" }),
  };
};

export const handler = lambdaWrapper<DeleteUrlQueryParams, object>(deleteUrl, [
  "userId",
  "url",
]);
