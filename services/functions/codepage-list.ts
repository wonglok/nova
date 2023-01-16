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
import { SITE_ADMINS } from "../../stacks/Config";
// import slugify from "slugify";

export const handler = ApiHandler(async () => {
  const session = useSession();

  // // Check user is authenticated
  if (session.type !== "user") {
    throw new Error("Not authenticated");
  }

  if (!SITE_ADMINS.some((admin) => admin === session.properties.userID)) {
    throw new Error("Not admin");
  }

  //
  const userID = session.properties.userID;

  const bodyText = useBody();

  const bodyData = JSON.parse(bodyText || JSON.stringify({ oid: "" }));

  let { folderID } = bodyData;

  let { slug } = bodyData;
  //

  const ddb = new DynamoDBClient({});

  let data = await ddb.send(
    new ScanCommand({
      FilterExpression: "folderID = :folderID",
      ExpressionAttributeValues: {
        ":folderID": { S: folderID },
        // ":siteID": { S: siteID },
        // ":userID": { S: userID },
      },

      /*
      //
        oid: oid,
        slug: slug,
        siteID,
        seo: {8
          slug,
        },
        userID: session.properties.userID,
        createdAt: new Date().getTime(),
      */
      //
      TableName: Table.codepage.tableName,
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      list: (data.Items || [])
        .filter((e) => e)
        .map((e) => unmarshall(e))
        .map((e) => {
          let newitem = { ...e };
          // delete newitem.seo;
          return newitem;
        }),
    }),
  };
});
