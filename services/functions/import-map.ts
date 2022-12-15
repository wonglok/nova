import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { Generator } from "@jspm/generator";

// import npmFetch from "npm-registry-fetch";

export const handler = async (event: { body: string }) => {
  const generator = new Generator({
    mapUrl: import.meta.url,
    env: ["browser", "production", "module"],
  });

  let bodyData = JSON.parse(event.body);
  // console.log(JSON.parse(event.body));

  for (let packID in bodyData.packages) {
    await generator.install(bodyData.packages[packID]);
  }

  return {
    //
    statusCode: 200,
    //
    // headers: { "Content-Type": "text/plain" },
    //
    headers: { "Content-Type": "text/javascript" },
    body: `${JSON.stringify(generator.getMap(), null, 2)}`,
  };
};
