import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { getRecord, updateRecord } from "/opt/dbHandler";
import { lambdaWrapper } from "/opt/lambdaWrapper";
import { UrlRecord } from "../../types/UrlRecord";

const dynamoDbClient = new DynamoDBClient({});
const urlTableName = process.env.URL_TABLE_NAME!;

export interface GetUrlQueryParams {
  url: string;
}
const getUrlHandler = async ({
  queryParams,
}: {
  queryParams: GetUrlQueryParams;
}): Promise<APIGatewayProxyResult> => {
  const { url: shortUrl } = queryParams;

  console.log("Fetching URL with key:", { shortUrl });

  const item = (await getRecord(dynamoDbClient, urlTableName, {
    shortUrl,
  })) as UrlRecord;

  if (!item) {
    console.error("URL not found for code:", shortUrl);
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "URL not found" }),
    };
  }

  console.log("Retrieved URL:", item);
  await updateRecord(
    dynamoDbClient,
    urlTableName,
    { shortUrl },
    "SET visitCount = visitCount + :inc",
    {
      ExpressionAttributeValues: { ":inc": 1 },
    }
  );

  console.log("Successfully incremented visit count");
  return {
    statusCode: 301,
    headers: {
      Location: item.originalUrl,
    },
    body: "",
  };
};

export const handler = lambdaWrapper<GetUrlQueryParams, object>(getUrlHandler, [
  "url",
]);
