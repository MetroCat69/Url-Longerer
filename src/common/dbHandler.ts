import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import {
  PutCommandInput,
  DeleteCommandInput,
  GetCommandInput,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  QueryCommandInput,
  GetCommand,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";

export const createDynamoDBClient = (
  params: DynamoDBClientConfig = {}
): DynamoDBClient => new DynamoDBClient(params);

export const createRecord = async (
  dynamoDbClient: DynamoDBClient,
  tableName: string,
  Item: object,
  indexKeyName?: string,
  ConditionExpression?: string,
  options?: Omit<PutCommandInput, "TableName" | "Item" | "ConditionExpression">
) => {
  const finalConditionExpression =
    ConditionExpression ?? `attribute_not_exists(${indexKeyName})`;

  const putParams: PutCommandInput = {
    TableName: tableName,
    Item,
    ConditionExpression: finalConditionExpression,
    ...options,
  };

  console.log("putting item with params", putParams);

  const command = new PutCommand(putParams);
  const result = await dynamoDbClient.send(command);

  if (result.$metadata.httpStatusCode !== 200) {
    throw new Error(
      `Failed to create item. Received HTTP Status: ${result.$metadata.httpStatusCode}`
    );
  }

  console.log("Successfully created item with params", putParams);
};

export const deleteRecord = async (
  dynamoDbClient: DynamoDBClient,
  tableName: string,
  Key: object,
  options?: Omit<DeleteCommandInput, "TableName" | "Key">
) => {
  const deleteParams: DeleteCommandInput = {
    TableName: tableName,
    Key,
    ...options,
  };

  console.log("Deleting item with params", deleteParams);

  const command = new DeleteCommand(deleteParams);
  const result = await dynamoDbClient.send(command);

  if (result.$metadata.httpStatusCode !== 200) {
    throw new Error(
      `Failed to delete item. Received HTTP Status: ${result.$metadata.httpStatusCode}`
    );
  }

  console.log("Successfully deleted item with params", deleteParams);
};

export const getRecord = async (
  dynamoDbClient: DynamoDBClient,
  tableName: string,
  key: Record<string, unknown>,
  options?: Omit<GetCommandInput, "TableName" | "Key">
) => {
  const getParams: GetCommandInput = {
    TableName: tableName,
    Key: key,
    ...options,
  };

  console.log("getting item with params", getParams);

  const command = new GetCommand(getParams);
  const result = await dynamoDbClient.send(command);

  if (result.$metadata.httpStatusCode !== 200) {
    throw new Error(
      `Failed to get item. Received HTTP Status: ${result.$metadata.httpStatusCode}`
    );
  }

  console.log("Successfully created item with params", getParams);
  return result.Item;
};

export const updateRecord = async (
  dynamoDbClient: DynamoDBClient,
  tableName: string,
  key: Record<string, unknown>,
  UpdateExpression: string,
  options?: Omit<UpdateCommandInput, "TableName" | "Key" | "UpdateExpression">
) => {
  const updateParams: UpdateCommandInput = {
    TableName: tableName,
    Key: key,
    UpdateExpression,
    ...options,
  };

  console.log("updating record with params", updateParams);

  const command = new UpdateCommand(updateParams);
  const result = await dynamoDbClient.send(command);

  if (result.$metadata.httpStatusCode !== 200) {
    throw new Error(
      `Failed to get item. Received HTTP Status: ${result.$metadata.httpStatusCode}`
    );
  }

  console.log("Successfully created item with params", updateParams);
};

export const queryDb = async <T>(
  dynamoDbClient: DynamoDBClient,
  queryParams: QueryCommandInput
): Promise<T[]> => {
  console.log(`Quering data with params:`, queryParams);

  const querryCommand = new QueryCommand(queryParams);
  const queryResult = await dynamoDbClient.send(querryCommand);

  if (queryResult.$metadata.httpStatusCode !== 200) {
    throw new Error(
      `Failed to delete record. Received HTTP Status: ${queryResult.$metadata.httpStatusCode}`
    );
  }

  console.log(`Query result:`, queryResult);

  const result = queryResult.Items || [];
  return result as T[];
};
