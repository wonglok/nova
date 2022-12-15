import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import npmFetch from "npm-registry-fetch";

export const handler = async (event) => {
  //
  const data = await npmFetch("three", {}).then((r) => r.json());

  let versionsList = Object.keys(data.versions);

  let latestVersion = versionsList[versionsList.length - 1];

  let resolution = data.versions[latestVersion];

  console.log(resolution);

  return {
    statusCode: 200,
    // headers: { "Content-Type": "text/plain" },
    headers: { "Content-Type": "text/javascript" },
    body: `${JSON.stringify(resolution)}`,
  };
};
