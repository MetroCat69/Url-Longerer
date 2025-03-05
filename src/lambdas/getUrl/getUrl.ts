import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { getRecord, updateRecord } from "/opt/dbHandler";
import { lambdaWrapper } from "/opt/lambdaWrapper";
import { UrlRecord } from "../../types/UrlRecord";
import {
  getRedisClient,
  connectRedisClient,
  redisGet,
  redisSet,
} from "/opt/redisHandler";
import { RedisClientType } from "redis";

const dynamoDbClient = new DynamoDBClient({});
const urlTableName = process.env.URL_TABLE_NAME!;

export interface GetUrlQueryParams {
  url: string;
}

const handleUrlRedirect = async (
  shortUrl: string,
  item: UrlRecord,
  redisClient: RedisClientType
): Promise<APIGatewayProxyResult> => {
  await updateRecord(
    dynamoDbClient,
    urlTableName,
    { shortUrl },
    "SET visitCount = visitCount + :inc",
    {
      ExpressionAttributeValues: { ":inc": 1 },
    }
  );

  await redisClient.quit();

  return {
    statusCode: 301,
    headers: {
      Location: item.originalUrl,
    },
    body: "",
  };
};

const getUrlHandler = async ({
  queryParams,
}: {
  queryParams: GetUrlQueryParams;
}): Promise<APIGatewayProxyResult> => {
  const { url: shortUrl } = queryParams;

  const redisClient = await getRedisClient();
  await connectRedisClient(redisClient);

  //Search in redis first
  let item = (await redisGet(redisClient, shortUrl)) as UrlRecord;
  if (item) {
    return handleUrlRedirect(shortUrl, item, redisClient);
  }

  //if not in redis search in dynamo
  item = (await getRecord(dynamoDbClient, urlTableName, {
    shortUrl,
  })) as UrlRecord;

  if (!item) {
    await redisClient.quit();
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "URL not found" }),
    };
  }

  await redisSet(redisClient, shortUrl, item, 3600);
  return handleUrlRedirect(shortUrl, item, redisClient);
};

export const handler = lambdaWrapper<GetUrlQueryParams, object>(getUrlHandler, [
  "url",
]);
