import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";

export const createDynamoDBClient = (
  params: DynamoDBClientConfig = {}
): DynamoDBClient => new DynamoDBClient(params);
