import {
  AuthHandler,
  GoogleAdapter,
  Session,
  // createAdapter,
} from "@serverless-stack/node/auth";
import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  // DeleteItemCommand,
  // ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { Table } from "@serverless-stack/node/table";
import {
  useHeaders,
  // useHeaders,
  usePath,
  useQueryParam,
  // useQueryParams,
} from "@serverless-stack/node/api";
import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { utils } from "ethers";
import moment from "moment";
import { hashMD5 } from "../lib/md5.js";

declare module "@serverless-stack/node/auth" {
  export interface SessionTypes {
    user: {
      userID: string;
      tenantID: string;
      nonce: string;
    };
  }
}

export const getGuestID = function () {
  return (
    "_guest_" +
    Math.random().toString(36).substr(2, 9) +
    Math.random().toString(36).substr(2, 9) +
    Math.random().toString(36).substr(2, 9) +
    Math.random().toString(36).substr(2, 9) +
    Math.random().toString(36).substr(2, 9) +
    Math.random().toString(36).substr(2, 9) +
    Math.random().toString(36).substr(2, 9)
  );
};

const SITE_URL = process.env.SITE_URL || ``;
const GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID || "";
let localURL = process.env.LOCAL_SITE_URL || `https://wonglok.ap.ngrok.io`;

let GuestAdapter =
  (_: any) => (): Promise<APIGatewayProxyStructuredResultV2> => {
    return new Promise(async (resolve) => {
      let path = usePath();
      let headers = useHeaders();
      let ip = headers["x-forwarded-for"] || getGuestID();

      if (
        path[0] === "auth" &&
        path[1] === "guest" &&
        path[2] === "authorize"
      ) {
        const dt = moment().format("YYYY-MM-DD");
        const guestID = hashMD5(ip);
        const ddb = new DynamoDBClient({});

        await ddb.send(
          new PutItemCommand({
            TableName: Table.users.tableName,
            Item: marshall({
              tenantID: "guest",
              userId: guestID,
              email: "",
              picture: "",
              name: "Guest",
              timestamp: dt,
            }),
          })
        );

        return resolve(
          Session.parameter({
            redirect: process.env.IS_LOCAL ? localURL : SITE_URL,

            // redirect: "http://127.0.0.1:5173",
            type: "user",
            properties: {
              tenantID: "guest",
              userID: guestID,
              nonce: getGuestID(),
            },
          })
        );
      } else {
        resolve({
          statusCode: 401,
          body: JSON.stringify({
            msg: "bad",
          }),
        });
      }
      // utils.verifyMessage(originalString, originalSignature);
      //
    });
  };

let WalletAdapter =
  (_: any) => (): Promise<APIGatewayProxyStructuredResultV2> => {
    return new Promise(async (resolve) => {
      let path = usePath();
      let raw = useQueryParam("raw") || "unknown string";
      let signature = useQueryParam("signature") || "unknown signature";

      if (
        path[0] === "auth" &&
        path[1] === "wallet" &&
        path[2] === "authorize"
      ) {
        let address = "";
        try {
          address = utils.verifyMessage(raw, signature);
        } catch (e) {
          console.error(e);

          return resolve({
            statusCode: 401,
            body: JSON.stringify({
              msg: "bad signature",
            }),
          });
        }

        if (address && raw.includes(address)) {
          // resolve({
          //   statusCode: 200,
          //   body: JSON.stringify({
          //     tenantID: "ethers",
          //     userId: address,
          //   }),
          // });

          //DeleteItemCommand

          const ddb = new DynamoDBClient({});

          await ddb.send(
            new PutItemCommand({
              TableName: Table.users.tableName,
              Item: marshall({
                tenantID: "ethers",
                userId: address,
                email: "",
                picture: "",
                name: address,
              }),
            })
          );

          return resolve(
            Session.parameter({
              redirect: process.env.IS_LOCAL ? localURL : SITE_URL,

              // redirect: "http://127.0.0.1:5173",
              type: "user",
              properties: {
                tenantID: "ethers",
                userID: address,
                nonce: getGuestID(),
              },
            })
          );
        } else {
          resolve({
            statusCode: 401,
            body: JSON.stringify({
              msg: "no address",
            }),
          });
        }
      } else {
        resolve({
          statusCode: 401,
          body: JSON.stringify({
            msg: "bad",
          }),
        });
      }
      // utils.verifyMessage(originalString, originalSignature);
      //
    });
  };

export const handler = AuthHandler({
  providers: {
    guest: GuestAdapter({}),
    wallet: WalletAdapter({}),
    google: GoogleAdapter({
      mode: "oidc",
      clientID: GOOGLE_CLIENT_ID,

      onSuccess: async (tokenset) => {
        //
        // return {
        //   statusCode: 200,
        //   body: JSON.stringify(tokenset.claims(), null, 4),
        // };
        //

        const claims = tokenset.claims();

        const ddb = new DynamoDBClient({});
        await ddb.send(
          new PutItemCommand({
            TableName: Table.users.tableName,
            Item: marshall({
              tenantID: "google",
              userId: claims.sub,
              email: claims.email,
              picture: claims.picture,
              name: claims.given_name,
            }),
          })
        );

        return Session.parameter({
          redirect: process.env.IS_LOCAL ? localURL : SITE_URL,

          // redirect: "http://127.0.0.1:5173",
          type: "user",
          properties: {
            tenantID: "google",
            userID: claims.sub,
            nonce: getGuestID(),
          },
        });
      },
    }),
  },
});

//
