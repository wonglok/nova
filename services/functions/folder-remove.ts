import { Table } from "@serverless-stack/node/table";
import { ApiHandler, useBody } from "@serverless-stack/node/api";
// import { useSession } from "@serverless-stack/node/auth";
import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  // GetItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { useSession } from "@serverless-stack/node/auth";
// import { v4 } from "uuid";
// import slugify from "slugify";
import { SITE_ADMINS } from "../../stacks/Config";

export const handler = ApiHandler(async () => {
  const session = useSession();

  // // Check user is authenticated
  if (session.type !== "user") {
    throw new Error("Not authenticated");
  }

  if (!SITE_ADMINS.some((admin) => admin === session.properties.userID)) {
    throw new Error("Not admin");
  }

  // // Check user is authenticated
  // if (session.type !== "user") {
  //   throw new Error("Not authenticated");
  // }

  const userID = session.properties.userID;

  const bodyText = useBody();

  const bodyData = JSON.parse(bodyText || JSON.stringify({ oid: "" }));

  let { oid } = bodyData;

  const ddb = new DynamoDBClient({});

  //

  let data = await ddb.send(
    new GetItemCommand({
      TableName: Table.codefolder.tableName,
      Key: {
        oid: { S: `${oid}` },
      },
    })
  );

  let dataItem = unmarshall(data.Item!) || { userID: "" };

  if (dataItem.userID === session?.properties?.userID) {
    await ddb.send(
      new DeleteItemCommand({
        TableName: Table.codefolder.tableName,
        Key: {
          oid: { S: `${oid}` },
        },
      })
    );
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  };
});
