import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  console.log("aaaa");
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ message: "Hello, World!" }),
  };
};
