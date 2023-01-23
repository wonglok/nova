import { Table } from "@serverless-stack/node/table";
import { ApiHandler, useBody } from "@serverless-stack/node/api";
// import { useSession } from "@serverless-stack/node/auth";
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
  // GetItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { useSession } from "@serverless-stack/node/auth";
import { v4 } from "uuid";
import slugify from "slugify";
import { SITE_ADMINS } from "../../stacks/Config";

export const create = ApiHandler(async () => {
  let statusCode = 200;
  let returnBody = JSON.stringify({});
  const session = useSession();

  // Check user is authenticated
  if (session.type !== "user") {
    throw new Error("Not authenticated");
  }

  if (!SITE_ADMINS.some((admin) => admin === session.properties.userID)) {
    throw new Error("Not admin");
  }

  const body = useBody();

  const reqBodyJson = JSON.parse(body || '{sitepath: ""}');

  const ddb = new DynamoDBClient({});

  if (session.properties.tenantID === "guest") {
    return {
      statusCode: 403,
      body: JSON.stringify({
        ok: false,
        reason: "guest cannot create site",
      }),
    };
  }

  let oid = v4() + "";
  try {
    await ddb.send(
      new PutItemCommand({
        TableName: Table.appFolder.tableName,
        Item: marshall({
          //

          oid: oid,
          userID: session.properties.userID,
          createdAt: new Date().getTime(),

          //
          displayName: reqBodyJson.displayName,
          thumbURL: "",
        }),
      })
    );
  } catch (err) {
    console.error(err);

    statusCode = 406;
    returnBody = JSON.stringify({
      ok: false,
      reason: "db error, cannot create site",
    });

    return {
      statusCode,
      body: returnBody,
    };
  }

  try {
    const data = await ddb.send(
      new GetItemCommand({
        TableName: Table.appFolder.tableName,
        Key: marshall({
          oid: oid,
        }),
      })
    );

    return {
      statusCode,
      body: JSON.stringify(unmarshall(data.Item!)),
    };
  } catch (err) {
    console.error(err);

    statusCode = 406;
    returnBody = JSON.stringify({
      ok: false,
      reason: "db error, cannot get site",
    });

    console.error(console);
    return {
      statusCode,
      body: returnBody,
    };
  }
});

export const update = ApiHandler(async () => {
  const session = useSession();

  // Check user is authenticated
  if (session.type !== "user") {
    throw new Error("Not authenticated");
  }

  if (!SITE_ADMINS.some((admin) => admin === session.properties.userID)) {
    throw new Error("Not admin");
  }

  const userID = session.properties.userID;

  const bodyText = useBody();

  const bodyData = JSON.parse(bodyText || JSON.stringify({}));

  let { object } = bodyData;

  const ddb = new DynamoDBClient({});

  let data = await ddb.send(
    new GetItemCommand({
      TableName: Table.appFolder.tableName,
      Key: {
        oid: { S: `${object.oid}` },
      },
    })
  );

  let dataItem = unmarshall(data.Item!);

  if (dataItem.userID === session?.properties?.userID) {
    await ddb.send(
      new PutItemCommand({
        TableName: Table.appFolder.tableName,
        Item: marshall(object),
      })
    );
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  };
});

export const remove = ApiHandler(async () => {
  const session = useSession();

  // // Check user is authenticated
  if (session.type !== "user") {
    throw new Error("Not authenticated");
  }

  if (!SITE_ADMINS.some((admin) => admin === session.properties.userID)) {
    throw new Error("Not admin");
  }

  // // Check user is authenticated
  // if (session.type !== "user") {
  //   throw new Error("Not authenticated");
  // }

  const userID = session.properties.userID;

  const bodyText = useBody();

  const bodyData = JSON.parse(bodyText || JSON.stringify({ oid: "" }));

  let { oid } = bodyData;

  const ddb = new DynamoDBClient({});

  //

  let data = await ddb.send(
    new GetItemCommand({
      TableName: Table.appFolder.tableName,
      Key: {
        oid: { S: `${oid}` },
      },
    })
  );

  let dataItem = unmarshall(data.Item!) || { userID: "" };

  if (dataItem.userID === session?.properties?.userID) {
    await ddb.send(
      new DeleteItemCommand({
        TableName: Table.appFolder.tableName,
        Key: {
          oid: { S: `${oid}` },
        },
      })
    );
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  };
});

export const get = ApiHandler(async () => {
  const session = useSession();

  // // Check user is authenticated
  if (session.type !== "user") {
    throw new Error("Not authenticated");
  }

  if (!SITE_ADMINS.some((admin) => admin === session.properties.userID)) {
    throw new Error("Not admin");
  }

  // const userID = session.properties.userID;

  const bodyText = useBody();

  const bodyData = JSON.parse(bodyText || JSON.stringify({ oid: "" }));

  let { oid } = bodyData;

  const ddb = new DynamoDBClient({});

  let data = await ddb.send(
    new GetItemCommand({
      TableName: Table.appFolder.tableName,
      Key: {
        oid: { S: `${oid}` },
      },
    })
  );

  let dataItem = unmarshall(data.Item!) || false;

  return {
    statusCode: 200,
    body: JSON.stringify({ item: dataItem }),
  };
});

export const list = ApiHandler(async () => {
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

  let { siteID } = bodyData;

  let { slug } = bodyData;
  //

  const ddb = new DynamoDBClient({});

  let data = await ddb.send(
    new ScanCommand({
      // FilterExpression: "siteID = :siteID",
      // ExpressionAttributeValues: {
      //   // ":siteID": { S: siteID },
      //   // ":siteID": { S: siteID },
      //   // ":userID": { S: userID },
      // },

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
      TableName: Table.appFolder.tableName,
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
