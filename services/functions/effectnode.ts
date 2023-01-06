import {
  ApiHandler,
  useBody,
  useHeaders,
  usePath,
  useQueryParams,
  WebSocketApi,
} from "@serverless-stack/node/api";
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
// import { useSession } from "@serverless-stack/node/auth";
// import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { useSession } from "@serverless-stack/node/auth";
// import { Table } from "@serverless-stack/node/table";
import { EffectNodeREST } from "../effectnode/EffectNodeREST";
// import { ApiGatewayManagementApi, DynamoDB } from "aws-sdk";
// import { v4 } from "uuid";
// import slugify from "slugify";

export const handler = ApiHandler(async (event, context) => {
  const session = useSession();

  const bodyRaw = useBody();

  const path = usePath();

  const headers = useHeaders();

  const query = useQueryParams();

  const isLoggedIn = () => {
    return session.type === "user";
  };

  try {
    let effectNode = new EffectNodeREST({
      resources: {
        query,
        bodyRaw,
        session,
        headers,
        path,
        isLoggedIn,
      },
    });

    await effectNode.work();

    return effectNode.response;
  } catch (e) {
    console.error(e);
    return {
      statusCode: 503,
      body: JSON.stringify({ reason: "bugged" }),
    };
  }
});
