import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export type LambdaHandler<
  TQuery = object,
  TBody = object,
  THeaders = object
> = (params: {
  queryParams: TQuery;
  body: TBody;
  headers: THeaders;
}) => Promise<APIGatewayProxyResult>;

export const lambdaWrapper =
  <TQuery = object, TBody = object, THeaders = object>(
    handler: LambdaHandler<TQuery, TBody, THeaders>,
    requiredQueryParams?: (keyof TQuery)[],
    requiredBodyFields?: (keyof TBody)[],
    requiredHeaders?: (keyof THeaders)[]
  ) =>
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      console.log("Received event:", JSON.stringify(event, null, 2));

      const queryParams = (event.queryStringParameters ||
        {}) as Partial<TQuery>;
      const headers = (event.headers || {}) as Partial<THeaders>;
      const body: Partial<TBody> = event.body ? JSON.parse(event.body) : {};

      if (requiredQueryParams) {
        const missingQueryParams = requiredQueryParams.filter(
          (param) => !(param in queryParams)
        );
        if (missingQueryParams.length > 0) {
          const message = `Missing required query parameters: ${missingQueryParams.join(
            ", "
          )}`;
          console.error(message);
          return {
            statusCode: 400,
            body: JSON.stringify({
              message: message,
            }),
          };
        }
      }

      if (requiredBodyFields) {
        const missingFields = requiredBodyFields.filter(
          (field) => !(field in body)
        );
        if (missingFields.length > 0) {
          const message = `Missing required body fields: ${missingFields.join(
            ", "
          )}`;
          console.error(message);
          return {
            statusCode: 400,
            body: JSON.stringify({
              message: message,
            }),
          };
        }
      }

      if (requiredHeaders) {
        const missingHeaders = requiredHeaders.filter(
          (header) => !(header in headers)
        );
        if (missingHeaders.length > 0) {
          const message = `Missing required body fields: ${missingHeaders.join(
            ", "
          )}`;
          console.error(message);
          return {
            statusCode: 400,
            body: JSON.stringify({
              message: message,
            }),
          };
        }
      }

      return await handler({
        queryParams: queryParams as TQuery,
        body: body as TBody,
        headers: headers as THeaders,
      });
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
