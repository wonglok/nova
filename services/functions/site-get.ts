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
// import { v4 } from "uuid";
// import slugify from "slugify";

export const handler = ApiHandler(async () => {
  const session = useSession();

  // Check user is authenticated
  if (session.type !== "user") {
    throw new Error("Not authenticated");
  }

  const bodyText = useBody();

  const bodyData = JSON.parse(bodyText || JSON.stringify({ _id: "" }));

  const ddb = new DynamoDBClient({});

  try {
    //

    let data = { Item: {} };
    let statusCode = 200;
    try {
      data = await ddb.send(
        new GetItemCommand({
          TableName: Table.sites.tableName,
          Key: marshall({
            _id: bodyData._id,
          }),
        })
      );
    } catch (err) {
      statusCode = 503;
      console.log("Error", err);
    }

    let item = unmarshall(data.Item!);

    return {
      statusCode: statusCode,
      body: JSON.stringify({ item }),
    };
  } catch (e) {
    return {
      statusCode: 503,
      body: JSON.stringify({ reason: e }),
    };
  }
});
