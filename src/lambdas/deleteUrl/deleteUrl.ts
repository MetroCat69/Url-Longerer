import { APIGatewayProxyResult } from "aws-lambda";
import { lambdaWrapper } from "/opt/lambdaWrapper";
import { deleteRecord, createDynamoDBClient } from "/opt/dbHandler";
import {
  getRedisClient,
  connectRedisClient,
  redisDelete,
} from "/opt/redisHandler";

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

  console.log(`deleting url${url} for user ${userId}`);

  const redisClient = await getRedisClient();
  await connectRedisClient(redisClient);

  await deleteRecord(dynamoDbClient, urlTableName, { shortUrl: url });
  console.log("Deleted URL from DynamoDB:", url);

  // delete data from redis to keep data consistent
  await redisDelete(redisClient, url);
  console.log("Deleted URL from Redis:", url);

  await redisClient.quit();

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `URL deleted successfully`,
    }),
  };
};

export const handler = lambdaWrapper<DeleteUrlQueryParams, object>(deleteUrl, [
  "userId",
  "url",
]);
