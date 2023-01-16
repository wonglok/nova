import { Table } from "@serverless-stack/node/table";
import { ApiHandler } from "@serverless-stack/node/api";
import { useSession } from "@serverless-stack/node/auth";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { SITE_ADMINS } from "../../stacks/Config";

export const handler = ApiHandler(async () => {
  const session = useSession();

  // Check user is authenticated
  if (session.type !== "user") {
    throw new Error("Not authenticated");
  }

  const ddb = new DynamoDBClient({});
  const data = await ddb.send(
    new GetItemCommand({
      TableName: Table.users.tableName,
      Key: marshall({
        userId: session.properties.userID,
      }),
    })
  );

  if (!SITE_ADMINS.some((admin) => admin === session.properties.userID)) {
    throw new Error("Not admin");
  }

  return {
    statusCode: 200,
    body: JSON.stringify(unmarshall(data.Item!)),
  };
});
