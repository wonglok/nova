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

  const bodyText = useBody();

  const bodyData = JSON.parse(bodyText || JSON.stringify({ slug: "" }));

  const ddb = new DynamoDBClient({});

  try {
    //

    let data = { Items: [] };
    try {
      // Set the parameters.
      const Params = {
        // Specify which items in the results are returned.
        FilterExpression: "userID = :userID",
        // Define the expression attribute value, which are substitutes for the values you want to compare.
        ExpressionAttributeValues: {
          ":userID": { S: session.properties.userID + "" },
        },
        // Set the projection expression, which the the attributes that you want.
        // ProjectionExpression: "slug, siteID",
        TableName: Table.sites.tableName,
      };

      data = await ddb.send(new ScanCommand(Params));
    } catch (err) {
      statusCode = 503;
      console.log("Error", err);
    }

    let list = data.Items.map((it) => {
      return unmarshall(it);
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ list }),
    };
  } catch (e) {
    return {
      statusCode: 503,
      body: JSON.stringify({ reason: e }),
    };
  }
});
