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

  const appFolderTable = new Table(stack, "appFolder", {
    fields: {
      oid: "string",
    },
    primaryIndex: { partitionKey: "oid" },
  });

  const appSnapshotTable = new Table(stack, "appSnapshot", {
    fields: {
      oid: "string",
    },
    primaryIndex: { partitionKey: "oid" },
  });

  //
  //
  //
  // code folder
  // code page
  // code modules
  // code modules->code file / json file
  // code modules->detail

  //

  const MyTables = [
    //
    appFolderTable,
    appSnapshotTable,
    usersTable,
  ];

  //------ WebSocket API ------//
  const auth = new Auth(stack, "auth", {
    authenticator: {
      environment: {
        SITE_URL: PRODUCTION_SITE_URL,
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
        bind: [...MyTables],
      },
    },
    routes: {
      //
      "GET /": "functions/discovery.handler",
      "GET /script": "functions/script.handler",
      "POST /import-map": "functions/import-map.handler",
      "GET /session": "functions/session.handler",

      "GET /bundle/{seg1}/{seg2}/{seg3}/{seg4}": "functions/bundle.handler",

      "POST /app-folder-create": "functions/app-folder.create",
      "POST /app-folder-get": "functions/app-folder.get",
      "POST /app-folder-list": "functions/app-folder.list",
      "POST /app-folder-update": "functions/app-folder.update",
      "POST /app-folder-remove": "functions/app-folder.remove",

      "POST /app-snapshot-create": "functions/app-snapshot.create",
      "POST /app-snapshot-get": "functions/app-snapshot.get",
      "POST /app-snapshot-list": "functions/app-snapshot.list",
      "POST /app-snapshot-update": "functions/app-snapshot.update",
      "POST /app-snapshot-remove": "functions/app-snapshot.remove",
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
