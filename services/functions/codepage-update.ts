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
import { v4 } from "uuid";
// import slugify from "slugify";
import { SITE_ADMINS } from "../../stacks/Config";

export const handler = ApiHandler(async () => {
  const session = useSession();

  // Check user is authenticated
  if (session.type !== "user") {
    throw new Error("Not authenticated");
  }

  if (!SITE_ADMINS.some((admin) => admin === session.properties.userID)) {
    throw new Error("Not admin");
  }

  const userID = session.properties.userID;

  const bodyText = useBody();

  const bodyData = JSON.parse(bodyText || JSON.stringify({}));

  let { object } = bodyData;

  const ddb = new DynamoDBClient({});

  let data = await ddb.send(
    new GetItemCommand({
      TableName: Table.codepage.tableName,
      Key: {
        oid: { S: `${object.oid}` },
      },
    })
  );

  let dataItem = unmarshall(data.Item!);

  let ok = await checkTaken({ slug: object.slug, ddb });

  if (!ok) {
    return {
      statusCode: 406,
      body: JSON.stringify({ reason: "taken" }),
    };
  }

  if (ok && dataItem.userID === session?.properties?.userID) {
    await ddb.send(
      new PutItemCommand({
        TableName: Table.codepage.tableName,
        Item: marshall(object),
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  }
});

async function checkTaken({ slug, ddb }) {
  // Set the parameters.

  let data = { Items: [] };
  try {
    data = await ddb.send(
      new ScanCommand({
        // Specify which items in the results are returned.
        FilterExpression: "slug = :slug",
        // Define the expression attribute value, which are substitutes for the values you want to compare.
        ExpressionAttributeValues: {
          ":slug": { S: slug },
        },
        // Set the projection expression, which the the attributes that you want.
        // ProjectionExpression: "slug, siteID",
        TableName: Table.codepage.tableName,
      })
    );
  } catch (err) {
    console.log("Error", err);
  }

  // let list = data.Items.map((it) => {
  //   return unmarshall(it);
  // });

  return data.Items.length === 0;
}

//
