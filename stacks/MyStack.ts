import {
  StackContext,
  Api,
  Auth,
  Table,
  WebSocketApi,
} from "@serverless-stack/resources";
import { GOOGLE_CLIENT_ID, PRODUCTION_SITE_URL } from "./Config";
import { DistributionForBucket } from "./UGC";

export function MyStack({ stack, app }: StackContext) {
  const siteURL = PRODUCTION_SITE_URL;
  const stage = app.stage;
  const region = app.region;

  //------ UGC Bucekt and CDN ------//
  let ugc = new DistributionForBucket(stack, "UGC", {});

  const connTable = new Table(stack, "Connections", {
    fields: {
      id: "string",
    },
    primaryIndex: { partitionKey: "id" },
  });

  // Create the WebSocket API
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

  //------ Tablets ------//
  const usersTable = new Table(stack, "users", {
    fields: {
      userId: "string",
    },
    primaryIndex: { partitionKey: "userId" },
  });

  //------ WebSocket API ------//

  const auth = new Auth(stack, "auth", {
    authenticator: {
      environment: {
        SiteURL: siteURL,
        GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID,
      },
      handler: "functions/auth.handler",
    },
  });

  //
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
        bind: [usersTable],
      },
    },
    routes: {
      "GET /": "functions/discovery.handler",
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
