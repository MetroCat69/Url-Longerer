import { APIGatewayProxyResult } from "aws-lambda";
import { lambdaWrapper } from "../../common/lambdaWrapper";
import { createRecord, createDynamoDBClient } from "../../common/dbHandler";
import { UrlRecord } from "../../types/UrlRecord";
import { createHash } from "crypto";

export interface CreateUrlInput {
  domainName: string;
  userId: number;
}
const dynamoDbClient = createDynamoDBClient();
const urlTableName = process.env.URL_TABLE_NAME!;

function simpleHash(input: string): string {
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex");
}

const createUrl = async (
  validatedBody: CreateUrlInput
): Promise<APIGatewayProxyResult> => {
  const { domainName, userId } = validatedBody;

  const originalUrl = `https://${domainName}`;
  const shortUrl = simpleHash(originalUrl);
  const createdAt = new Date().toISOString();

  const urlRecord: UrlRecord = {
    shortUrl,
    userId: userId,
    createdAt,
    originalUrl,
    visitCount: 0,
  };

  await createRecord(
    dynamoDbClient,
    urlTableName,
    urlRecord,
    "shortUrl",
    "attribute_not_exists(shortUrl)"
  );

  console.log("Created URL", urlRecord);

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "Short URL created successfully",
      ...urlRecord,
    }),
  };
};

export const handler = lambdaWrapper<CreateUrlInput>(
  ["domainName", "userId"],
  createUrl
);
