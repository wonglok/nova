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

  const ddb = new DynamoDBClient({});

  //  AND userID = :userID AND siteID = :siteID
  let resultDomain = await ddb.send(
    new ScanCommand({
      // Specify which items in the results are returned.
      FilterExpression: "slug = :slug",
      ExpressionAttributeValues: {
        // ":siteID": { S: siteID },
        ":slug": { S: slug },
        // ":userID": { S: userID },
      },
      // Set the projection expression, which the the attributes that you want.
      // ProjectionExpression: "domain, siteID",
      TableName: Table.mycustomdoamins.tableName,
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
        TableName: Table.mycustomdoamins.tableName,
        Item: marshall({
          //
          oid: oid,
          slug: slug,
          siteID,
          userID: session.properties.userID,
          createdAt: new Date().getTime(),
        }),
      })
    );

    let data = await ddb.send(
      new ScanCommand({
        // Specify which items in the results are returned.
        FilterExpression: "slug = :slug",
        ExpressionAttributeValues: {
          // ":siteID": { S: siteID },
          ":slug": { S: slug },
          // ":userID": { S: userID },
        },
        // Set the projection expression, which the the attributes that you want.
        // ProjectionExpression: "domain, siteID",
        TableName: Table.mycustomdoamins.tableName,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        list: (data.Items || []).filter((e) => e).map((e) => unmarshall(e)),
      }),
    };
  }

  //

  //!SECTION

  //!SECTION

  // try {
  //   let data = { Item: {} };
  //   let statusCode = 200;
  //   try {
  //     data = await ddb.send(
  //       new GetItemCommand({
  //         TableName: Table.domains.tableName,
  //         Key: marshall({
  //           oid: bodyData.oid,
  //         }),
  //       })
  //     );
  //   } catch (err) {
  //     statusCode = 503;
  //     console.log("Error", err);
  //   }

  //   let item = unmarshall(data.Item!);

  //   return {
  //     statusCode: statusCode,
  //     body: JSON.stringify({ item }),
  //   };
  // } catch (e) {
  //   return {
  //     statusCode: 503,
  //     body: JSON.stringify({ reason: e }),
  //   };
  // }
});
