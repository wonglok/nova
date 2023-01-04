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
// import slugify from "slugify";

export const handler = ApiHandler(async () => {
  // const session = useSession();

  // // Check user is authenticated
  // if (session.type !== "user") {
  //   throw new Error("Not authenticated");
  // }

  // const userID = session.properties.userID;

  const bodyText = useBody();

  const bodyData = JSON.parse(bodyText || JSON.stringify({ oid: "" }));

  let { siteID } = bodyData;

  let { slug } = bodyData;
  //

  const ddb = new DynamoDBClient({});

  // console.log(slug);
  let data = await ddb.send(
    new ScanCommand({
      // Specify which items in the results are returned.
      FilterExpression: "slug = :slug",
      ExpressionAttributeValues: {
        // ":siteID": { S: siteID },
        ":slug": { S: slug },
        // ":userID": { S: userID },
      },
      // ProjectionExpression: "slug, siteID",
      TableName: Table.mycustomdoamins.tableName,
    })
  );

  // console.log(data);
  return {
    statusCode: 200,
    body: JSON.stringify({
      list: (data.Items || []).filter((e) => e).map((e) => unmarshall(e)),
    }),
  };
});
