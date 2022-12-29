import { Table } from "@serverless-stack/node/table";
import { ApiHandler, useBody } from "@serverless-stack/node/api";
// import { useSession } from "@serverless-stack/node/auth";
import {
  DynamoDBClient,
  // GetItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

export const handler = ApiHandler(async () => {
  const body = useBody();

  const reqBodyJson = JSON.parse(body || '{domain: ""}');

  //
  // console.log(reqBodyJson.domain);
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
      ":slug": { S: reqBodyJson.domain },
    },
    // Set the projection expression, which the the attributes that you want.
    // ProjectionExpression: "slug, siteID",
    TableName: Table.domains.tableName,
  };

  const ddb = new DynamoDBClient({});

  let data = { Items: [] };
  try {
    data = await ddb.send(new ScanCommand(Params));
  } catch (err) {
    console.log("Error", err);
  }

  let list = data.Items.map((it) => {
    return unmarshall(it);
  });
  // console.log(data);
  let first = list[0] || null;
  return {
    statusCode: 200,
    body: JSON.stringify(first),
  };
});

//
