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

export const ThisTableName = Table.AppVersion.tableName;

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

  const reqBodyJson = JSON.parse(body || '{slug: ""}');

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

  // let isOK = await checkTaken({
  //   slug: reqBodyJson.slug,
  //   ddb,
  // });
  // if (!isOK) {
  //   return {
  //     statusCode: 406,
  //     body: JSON.stringify({
  //       ok: false,
  //       reason: "taken",
  //     }),
  //   };
  // }

  let oid = v4() + "";
  try {
    await ddb.send(
      new PutItemCommand({
        TableName: ThisTableName,
        Item: marshall({
          oid: oid,
          userID: session.properties.userID,
          createdAt: new Date().getTime(),

          // slug: reqBodyJson.slug,
          // appEntryID: reqBodyJson.appEntryID,
          title: reqBodyJson.title,

          mainPackageName: "this-app",
          codePackages: [],

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
        TableName: ThisTableName,
        Key: marshall({
          oid: oid,
        }),
      })
    );

    return {
      statusCode,
      body: JSON.stringify(unmarshall(data.Item)),
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

  // let data = await ddb.send(
  //   new GetItemCommand({
  //     TableName: ThisTableName,
  //     Key: {
  //       oid: { S: `${object.oid}` },
  //     },
  //   })
  // );

  // let dataItem = unmarshall(data.Item);

  // if (dataItem.slug === object.slug) {
  //   return {
  //     statusCode: 200,
  //     body: JSON.stringify({ ok: true }),
  //   };
  // }

  // let ok = await checkTaken({ slug: object.slug, ddb });

  // if (!ok) {
  //   return {
  //     statusCode: 406,
  //     body: JSON.stringify({ reason: "taken" }),
  //   };
  // }

  let ok = true;
  // console.log(userID);

  // let ok = true;
  if (ok) {
    // if (ok && dataItem.userID === userID) {
    await ddb.send(
      new PutItemCommand({
        TableName: ThisTableName,
        Item: marshall(object),
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } else {
    return {
      statusCode: 200,
      body: JSON.stringify({ error: "fail" }),
    };
  }
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
      TableName: ThisTableName,
      Key: {
        oid: { S: `${oid}` },
      },
    })
  );

  let dataItem = unmarshall(data.Item) || { userID: "" };

  if (dataItem.userID === session?.properties?.userID) {
    await ddb.send(
      new DeleteItemCommand({
        TableName: ThisTableName,
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
      TableName: ThisTableName,
      Key: {
        oid: { S: `${oid}` },
      },
    })
  );

  let dataItem = unmarshall(data.Item) || false;

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

  // let { appEntryID } = bodyData;

  let { slug } = bodyData;
  //

  const ddb = new DynamoDBClient({});

  let data = await ddb.send(
    new ScanCommand({
      // FilterExpression: "appEntryID = :appEntryID",
      // ExpressionAttributeValues: {
      //   ":appEntryID": { S: appEntryID },
      //   // ":siteID": { S: siteID },
      //   // ":userID": { S: userID },
      // },
      TableName: ThisTableName,
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
          return newitem;
        }),
    }),
  };
});

// async function checkTaken({ slug, ddb }) {
//   // Set the parameters.

//   let data = { Items: [] };
//   try {
//     data = await ddb.send(
//       new ScanCommand({
//         FilterExpression: "slug = :slug",
//         ExpressionAttributeValues: {
//           ":slug": { S: slug },
//         },
//         TableName: ThisTableName,
//       })
//     );
//   } catch (err) {
//     console.log("Error", err);
//   }

//   return data.Items.length === 0;
// }

// //
