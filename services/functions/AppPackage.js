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
  BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { useSession } from "@serverless-stack/node/auth";
import { v4 } from "uuid";
import { SITE_ADMINS } from "../../stacks/Config";
import slugify from "slugify";

export const AppVersion = Table.AppVersion.tableName;
export const AppCodeFile = Table.AppCodeFile.tableName;

export const getID = function () {
  return v4() + "";
  // return (
  //   "_" +
  //   Math.random().toString(36).substr(2, 9) +
  //   Math.random().toString(36).substr(2, 9) +
  //   Math.random().toString(36).substr(2, 9)
  // );
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

    let appSource = reqBodyJson.appSource;

    let inboundAppPackages = appSource.appPackages;

    //

    for (let appPackageOne of inboundAppPackages) {
      //

      let newPackageOID = getID();

      appPackageOne.oid = newPackageOID;

      for (let modu of appPackageOne.modules) {
        let newModuOID = getID();
        let codeFilesData = JSON.parse(JSON.stringify(modu.files));
        modu.files = [];
        modu.oid = newModuOID;

        const params = {
          RequestItems: {
            [AppCodeFile]: [
              // {
              //   PutRequest: {
              //     Item: {
              //       KEY: { N: "KEY_VALUE" },
              //       ATTRIBUTE_1: { S: "ATTRIBUTE_1_VALUE" },
              //       ATTRIBUTE_2: { N: "ATTRIBUTE_2_VALUE" },
              //     },
              //   },
              // },

              ...codeFilesData.map((file) => {
                file.packageOID = newPackageOID;
                file.moduleOID = newModuOID;
                return {
                  PutRequest: {
                    Item: marshall({
                      oid: getID(),
                      userID: session.properties.userID,
                      createdAt: new Date().getTime(),

                      appGroupID: appVersionObject.appGroupID,
                      appVersionID: appVersionObject.oid,

                      // filter for each module
                      packageOID: file.packageOID,
                      moduleOID: file.moduleOID,

                      fileName: file.fileName || "app.js",
                      content: file.content || "",
                    }),
                  },
                };
              }),
            ],
          },
        };

        await ddb.send(new BatchWriteItemCommand(params)).catch((r) => {
          console.error(r);
        });
      }

      appVersionObject.appPackages.push(appPackageOne);
    }

    await ddb.send(
      new PutItemCommand({
        TableName: AppVersion,
        Item: marshall(appVersionObject),
      })
    );

    // let codeFiles = reqBodyJson.codeFiles;

    // let map = new Map();
    // let set = (key) => {
    //   map.set(key, getID());
    //   return map.get(key);
    // };
    // let get = (key) => {
    //   return map.get(key);
    // };

    // let oldPackID = appPackageOne.oid;
    // appPackageOne.oid = getID();
    // appPackageOne.modules.forEach((it) => {
    //   let oldModID = it.oid;
    //   it.oid = getID();

    //   codeFiles
    //     .filter((e) => e.moduleOID === oldModID && e.packageOID === oldPackID)
    //     .forEach((c) => {
    //       c.moduleOID = it.oid;
    //       c.packageOID = appPackageOne.oid;
    //     });
    // });

    // codeFiles.forEach((it) => {
    //   it.oid = getID();
    // });

    // appVersionObject.appPackages //= getID();
    //   .push(appPackageOne);

    // // Set the parameters
    // const params = {
    //   RequestItems: {
    //     [AppCodeFile]: [
    //       // {
    //       //   PutRequest: {
    //       //     Item: {
    //       //       KEY: { N: "KEY_VALUE" },
    //       //       ATTRIBUTE_1: { S: "ATTRIBUTE_1_VALUE" },
    //       //       ATTRIBUTE_2: { N: "ATTRIBUTE_2_VALUE" },
    //       //     },
    //       //   },
    //       // },

    //       ...codeFiles.map((file) => {
    //         return {
    //           PutRequest: {
    //             Item: marshall({
    //               oid: getID(),
    //               userID: session.properties.userID,
    //               createdAt: new Date().getTime(),

    //               appGroupID: appVersionObject.appGroupID,
    //               appVersionID: appVersionObject.oid,

    //               // filter for each module
    //               packageOID: file.packageOID,
    //               moduleOID: file.moduleOID,

    //               //
    //               fileName: file.fileName || "app.js",
    //               content: file.content || "",
    //             }),
    //           },
    //         };
    //       }),
    //     ],
    //   },
    // };

    // // let commandsArr = [];
    // // for (let file of codeFiles) {
    // //   commandsArr.push(
    // //     new PutItemCommand({
    // //       TableName: AppCodeFile,
    // //       Item: marshall({
    // //         oid: getID(),
    // //         userID: session.properties.userID,
    // //         createdAt: new Date().getTime(),

    // //         appGroupID: appVersionObject.appGroupID,
    // //         appVersionID: appVersionObject.oid,

    // //         // filter for each module
    // //         packageOID: file.packageOID,
    // //         moduleOID: file.moduleOID,

    // //         //
    // //         fileName: file.fileName || "app.js",
    // //         content: file.content || "",
    // //       }),
    // //     })
    // //   );
    // // }

    // await ddb.send(new BatchWriteItemCommand(params)).catch((r) => {
    //   console.error(r);
    // });

    await new Promise((r) => {
      setTimeout(r, 100);
    });

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
