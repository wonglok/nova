import { Table } from "@serverless-stack/node/table";
import { ApiHandler, useBody } from "@serverless-stack/node/api";
// import { useSession } from "@serverless-stack/node/auth";
import {
  DynamoDBClient,
  // GetItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import slugify from "slugify";

export const handler = ApiHandler(async () => {
  const body = useBody();
  let statusCode = 200;

  const reqBodyJson = JSON.parse(body || '{slug: ""}');

  let slug = slugify(reqBodyJson.slug, "_");

  //
  // console.log(reqBodyJson.slug);
  // // const session = useSession();
  //

  // // // Check user is authenticated
  // // if (session.type !== "user") {
  // //   throw new Error("Not authenticated");
  // // }

  // // unmarshall(data.Item!)

  // Set the parameters.
  const Params = {
    // Specify which items in the results are returned.
    FilterExpression: "slug = :slug",
    // Define the expression attribute value, which are substitutes for the values you want to compare.
    ExpressionAttributeValues: {
      ":slug": { S: reqBodyJson.slug },
    },
    // Set the projection expression, which the the attributes that you want.
    // ProjectionExpression: "slug, siteID",
    TableName: Table.sites.tableName,
  };

  const ddb = new DynamoDBClient({});

  let data = { Items: [] };
  try {
    data = await ddb.send(new ScanCommand(Params));
  } catch (err) {
    statusCode = 503;
    console.log("Error", err);
  }

  let list = data.Items.map((it) => {
    return unmarshall(it);
  });

  let first = {
    ok: list.length === 0,
  };

  //
  return {
    statusCode,
    body: JSON.stringify(first),
  };
});

//
