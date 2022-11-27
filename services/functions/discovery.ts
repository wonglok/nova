import { APIGatewayProxyHandlerV2 } from "aws-lambda";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  let getStage = () => {
    if (process.env.SST_STAGE?.indexOf("sst-") === 0) {
      return "development";
    } else {
      return process.env.SST_STAGE;
    }
  };

  const { stage, domainName } = event.requestContext;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      stage: `${getStage()}`,
      time: `${event.requestContext.time}`,
      services: {
        //
        stage,
        domainName,
      },
    }),
  };
};
