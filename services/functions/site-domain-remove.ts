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

export const handler = ApiHandler(async () => {
  const session = useSession();

  // Check user is authenticated
  if (session.type !== "user") {
    throw new Error("Not authenticated");
  }

  const userID = session.properties.userID;

  const bodyText = useBody();

  const bodyData = JSON.parse(bodyText || JSON.stringify({ _id: "" }));

  let { slug } = bodyData;

  const ddb = new DynamoDBClient({});

  //  AND userID = :userID AND siteID = :siteID
  let resultDomain = await ddb.send(
    new ScanCommand({
      // Specify which items in the results are returned.
      FilterExpression: "slug = :slug AND userID = :userID ",
      ExpressionAttributeValues: {
        // ":siteID": { S: siteID },
        ":slug": { S: slug },
        ":userID": { S: userID },
      },
      // Set the projection expression, which the the attributes that you want.
      // ProjectionExpression: "domain, siteID",
      TableName: Table.customdoamins.tableName,
    })
  );

  let list = resultDomain.Items || [];

  let proms = list
    .map((r) => {
      return unmarshall(r);
    })
    .map((li) => {
      console.log(li);
      return new Promise(async (resolve) => {
        let res = await ddb.send(
          new DeleteItemCommand({
            TableName: Table.customdoamins.tableName,
            Key: {
              _id: { S: `${li._id}` },
            },
          })
        );

        resolve(res);
      }).catch((err) => {
        console.error(err);
      });
    });

  await Promise.all(proms);

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  };
});
