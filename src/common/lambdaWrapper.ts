import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const lambdaWrapper =
  <T extends object>(
    requiredFields: (keyof T)[],
    handler: (validatedBody: T) => Promise<APIGatewayProxyResult>
  ) =>
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const body: Partial<T> = JSON.parse(event.body || "{}");

      const missingFields = requiredFields.filter((field) => !(field in body));
      if (missingFields.length > 0) {
        console.log("Missing required fields:", missingFields);
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: `Missing required fields: ${missingFields.join(", ")}`,
          }),
        };
      }

      // Cast to T after validation
      const validatedBody = body as T;

      // Call the actual Lambda logic
      return await handler(validatedBody);
    } catch (error) {
      console.error("Lambda execution failed", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Internal Server Error",
          error: (error as Error).message,
        }),
      };
    }
  };
