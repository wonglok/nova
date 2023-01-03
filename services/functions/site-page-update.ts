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

  const bodyData = JSON.parse(bodyText || JSON.stringify({}));

  let { object } = bodyData;

  const ddb = new DynamoDBClient({});

  let data = await ddb.send(
    new GetItemCommand({
      TableName: Table.mymetapages.tableName,
      Key: {
        oid: { S: `${object.oid}` },
      },
    })
  );

  let dataItem = unmarshall(data.Item!);

  console.log(dataItem);
  if (dataItem.userID === session?.properties?.userID) {
    await ddb.send(
      new PutItemCommand({
        TableName: Table.mymetapages.tableName,
        Item: marshall(object),
      })
    );
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  };
});
