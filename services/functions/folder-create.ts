import { Table } from "@serverless-stack/node/table";
import { ApiHandler, useBody } from "@serverless-stack/node/api";
// import { useSession } from "@serverless-stack/node/auth";
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  // GetItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { useSession } from "@serverless-stack/node/auth";
import { v4 } from "uuid";
import slugify from "slugify";
import { SITE_ADMINS } from "../../stacks/Config";

export const handler = ApiHandler(async () => {
  let statusCode = 200;
  let returnBody = JSON.stringify({});
  const session = useSession();

  // Check user is authenticated
  if (session.type !== "user") {
    throw new Error("Not authenticated");
  }

  if (!SITE_ADMINS.some((admin) => admin === session.properties.userID)) {
    throw new Error("Not admin");
  }

  const body = useBody();

  const reqBodyJson = JSON.parse(body || '{sitepath: ""}');

  const ddb = new DynamoDBClient({});

  if (session.properties.tenantID === "guest") {
    return {
      statusCode: 403,
      body: JSON.stringify({
        ok: false,
        reason: "guest cannot create site",
      }),
    };
  }

  let oid = v4() + "";
  try {
    await ddb.send(
      new PutItemCommand({
        TableName: Table.codefolder.tableName,
        Item: marshall({
          //

          oid: oid,
          userID: session.properties.userID,
          createdAt: new Date().getTime(),

          //
          displayName: reqBodyJson.displayName,
          thumbURL: "",
        }),
      })
    );
  } catch (err) {
    console.error(err);

    statusCode = 406;
    returnBody = JSON.stringify({
      ok: false,
      reason: "db error, cannot create site",
    });

    return {
      statusCode,
      body: returnBody,
    };
  }

  try {
    const data = await ddb.send(
      new GetItemCommand({
        TableName: Table.codefolder.tableName,
        Key: marshall({
          oid: oid,
        }),
      })
    );

    return {
      statusCode,
      body: JSON.stringify(unmarshall(data.Item!)),
    };
  } catch (err) {
    console.error(err);

    statusCode = 406;
    returnBody = JSON.stringify({
      ok: false,
      reason: "db error, cannot get site",
    });

    console.error(console);
    return {
      statusCode,
      body: returnBody,
    };
  }
});

//
