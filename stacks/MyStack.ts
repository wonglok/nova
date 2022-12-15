import {
  StackContext,
  Api,
  Auth,
  Table,
  WebSocketApi,
} from "@serverless-stack/resources";
import {
  GOOGLE_CLIENT_ID,
  LOCAL_SITE_URL,
  PRODUCTION_SITE_URL,
} from "./Config";
import { DistributionForBucket } from "./UGC";

export function MyStack({ stack, app }: StackContext) {
  const siteURL = PRODUCTION_SITE_URL;
  const stage = app.stage;
  const region = app.region;

  //------ UGC Bucekt and CDN ------//
  let ugc = new DistributionForBucket(stack, "UGC", {});

  //------ WebSocketApi Table ------//
  const connTable = new Table(stack, "Connections", {
    fields: {
      id: "string",
    },
    primaryIndex: { partitionKey: "id" },
  });

  const metaApi = new WebSocketApi(stack, "MetaApi", {
    defaults: {
      function: {
        bind: [connTable],
      },
    },
    routes: {
      $connect: "functions/socket-connect.main",
      $disconnect: "functions/socket-disconnect.main",
      $default: "functions/socket-sendMessage.main",
    },
    accessLog: false,
  });

  //------ Tables ------//
  const usersTable = new Table(stack, "users", {
    fields: {
      userId: "string",
    },
    primaryIndex: { partitionKey: "userId" },
  });

  const invitationTable = new Table(stack, "invitation", {
    fields: {
      _id: "string",
    },
    primaryIndex: { partitionKey: "_id" },
  });

  const followingTable = new Table(stack, "following", {
    fields: {
      _id: "string", // randID
      userID: "string",
      followingUserID: "string",
      followBackCache: "string",
    },
    primaryIndex: { partitionKey: "_id" },
  });

  const myTables = [usersTable, invitationTable, followingTable];

  //------ WebSocket API ------//
  const auth = new Auth(stack, "auth", {
    authenticator: {
      environment: {
        SITE_URL: siteURL,
        GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID,
        LOCAL_SITE_URL: LOCAL_SITE_URL,
      },
      handler: "functions/auth.handler",
    },
  });

  const api = new Api(stack, "api", {
    cors: {
      allowHeaders: ["*"],
      allowMethods: ["ANY"],
      allowOrigins: ["*"],
    },
    //

    defaults: {
      function: {
        environment: {
          ...ugc.envInfo,
        },
        bind: [...myTables],
      },
    },
    routes: {
      "GET /": "functions/discovery.handler",
      "GET /script": "functions/script.handler",
      "POST /import-map": "functions/import-map.handler",
      "GET /session": "functions/session.handler",
    },
  });

  // api.attachPermissions([usersTable, tableMetaIOApi])

  //
  auth.attach(stack, {
    api: api,
    prefix: "/auth",
  });

  stack.addOutputs({
    stage,
    region,
    metaApi: metaApi.url,
    ...ugc.envInfo,
    // PortalSiteURL: site.url,
    ApiEndpoint: api.url,
  });
}

//
// const site = new StaticSite(stack, "Site", {
//   path: "web",
//   buildCommand: "npm i; npm run build", // or "yarn build"
//   buildOutput: "dist",
//   environment: {
//     VITE_APP_API_URL: api.url,
//   },
//   //  vite: {
//   //      types: "types/my-env.d.ts",
//   //    }
// });
//
//
