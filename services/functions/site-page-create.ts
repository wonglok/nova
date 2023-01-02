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
  const session = useSession();

  // Check user is authenticated
  if (session.type !== "user") {
    throw new Error("Not authenticated");
  }

  const userID = session.properties.userID;

  const bodyText = useBody();

  const bodyData = JSON.parse(bodyText || JSON.stringify({ oid: "" }));

  let { siteID } = bodyData;

  let { slug } = bodyData;
  //

  const ddb = new DynamoDBClient({});

  let resultDomain = await ddb.send(
    new ScanCommand({
      //  AND userID = :userID AND siteID = :siteID
      FilterExpression: "slug = :slug",
      ExpressionAttributeValues: {
        // ":siteID": { S: siteID },
        ":slug": { S: slug },
        // ":userID": { S: userID },
      },
      // Set the projection expression, which the the attributes that you want.
      // ProjectionExpression: "domain, siteID",
      TableName: Table.mymetapages.tableName,
    })
  );

  if ((resultDomain.Items || []).length > 0.0) {
    return {
      statusCode: 409,
      body: JSON.stringify({ error: "domain_taken" }),
    };
  }

  let oid = v4() + "";

  //
  if ((resultDomain.Items || []).length === 0.0) {
    //

    await ddb.send(
      new PutItemCommand({
        TableName: Table.mymetapages.tableName,
        Item: marshall({
          //
          oid: oid,
          slug: slug,
          siteID,
          seo: {
            slug,
          },
          userID: session.properties.userID,
          createdAt: new Date().getTime(),
        }),
      })
    );

    let data = await ddb.send(
      new ScanCommand({
        FilterExpression: "slug = :slug",
        ExpressionAttributeValues: {
          // ":siteID": { S: siteID },
          ":slug": { S: slug },
          // ":userID": { S: userID },
        },
        // ProjectionExpression: "domain, siteID",
        TableName: Table.mymetapages.tableName,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        list: (data.Items || []).filter((e) => e).map((e) => unmarshall(e)),
      }),
    };
  } else {
    return {
      statusCode: 409,
      body: JSON.stringify({
        error: "taken",
      }),
    };
  }
});
