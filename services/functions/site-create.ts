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

export const handler = ApiHandler(async () => {
  let statusCode = 200;
  let returnBody = JSON.stringify({});
  const session = useSession();

  // Check user is authenticated
  if (session.type !== "user") {
    throw new Error("Not authenticated");
  }

  const body = useBody();

  const reqBodyJson = JSON.parse(body || '{slug: ""}');

  const ddb = new DynamoDBClient({});

  if (session.properties.tenantID === "guest") {
    statusCode = 403;
    returnBody = JSON.stringify({
      ok: false,
      reason: "guest cannot create site",
    });

    return {
      statusCode,
      body: returnBody,
    };
  }

  let slug = slugify(reqBodyJson.slug, "_");
  let isOK = await checkTaken({ ddb, slug: slug });

  if (!isOK) {
    statusCode = 406;
    returnBody = JSON.stringify({ ok: false, reason: "name taken" });

    return {
      statusCode,
      body: returnBody,
    };
  }

  let _id = v4() + "";
  try {
    await ddb.send(
      new PutItemCommand({
        TableName: Table.sites.tableName,
        Item: marshall({
          //

          _id: _id,
          slug: slug,
          userID: session.properties.userID,
          createdAt: new Date().getTime(),
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
        TableName: Table.sites.tableName,
        Key: marshall({
          _id: _id,
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
        TableName: Table.sites.tableName,
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
