import { APIGatewayProxyResult } from "aws-lambda";
import { lambdaWrapper } from "../../common/lambdaWrapper"; // Importing the lambdaWrapper utility
import { deleteRecord, createDynamoDBClient } from "../../common/dbHandler"; // Import the deleteRecord function

const dynamoDbClient = createDynamoDBClient();
const urlTableName = process.env.URL_TABLE_NAME!;

export interface DeleteUrlInput {
  url: string;
}

const deleteUrl = async (
  validatedBody: DeleteUrlInput
): Promise<APIGatewayProxyResult> => {
  const { url } = validatedBody;
  await deleteRecord(dynamoDbClient, urlTableName, {
    Key: { shortUrl: url },
  });

  console.log("Deleted url", url);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "URL deleted successfully" }),
  };
};

export const handler = lambdaWrapper<DeleteUrlInput>(["url"], deleteUrl);
