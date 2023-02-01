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

export const AppVersion = Table.AppVersion.tableName;
export const AppCodeFile = Table.AppCodeFile.tableName;

export const getID = function () {
  return (
    "_" +
    Math.random().toString(36).substr(2, 9) +
    Math.random().toString(36).substr(2, 9)
  );
};

export const importCode = ApiHandler(async () => {
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

  try {
    const data = await ddb.send(
      new GetItemCommand({
        TableName: AppVersion,
        Key: marshall({
          oid: reqBodyJson.appVersionID,
        }),
      })
    );

    let appVersionObject = unmarshall(data.Item);

    let appPackageOne = reqBodyJson.codePackage;
    let codeFiles = reqBodyJson.codeFiles;

    let map = new Map();
    let set = (key) => {
      map.set(key, getID());
      return map.get(key);
    };
    let get = (key) => {
      return map.get(key);
    };

    appPackageOne.oid = set(appPackageOne.oid);
    appPackageOne.modules.forEach((it) => {
      it.oid = set(it.oid);
    });

    codeFiles.forEach((it) => {
      it.oid = set(it.oid);
      it.packageOID = get(it.packageOID);
      it.moduleOID = get(it.moduleOID);
    });

    console.log(JSON.stringify(appVersionObject, null, "  "));

    appVersionObject.appPackages //= getID();
      .push(appPackageOne);

    await ddb.send(
      new PutItemCommand({
        TableName: AppVersion,
        Item: marshall(appVersionObject),
      })
    );

    for (let file of codeFiles) {
      await ddb
        .send(
          new PutItemCommand({
            TableName: AppCodeFile,
            Item: marshall({
              oid: file.oid,
              userID: session.properties.userID,
              createdAt: new Date().getTime(),

              appGroupID: appVersionObject.appGroupID,
              appVersionID: appVersionObject.oid,

              // filter for each module
              packageOID: file.packageOID,
              moduleOID: file.moduleOID,

              //
              fileName: file.fileName || "app.js",
              content: file.content || "",
            }),
          })
        )
        .catch((r) => {
          console.error(r);
        });
    }

    return {
      statusCode,
      body: JSON.stringify({ ok: true }),
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
