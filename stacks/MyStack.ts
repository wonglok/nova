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

  const AppEntry = new Table(stack, "AppEntry", {
    fields: {
      oid: "string",
    },
    primaryIndex: { partitionKey: "oid" },
  });

  const AppVersion = new Table(stack, "AppVersion", {
    fields: {
      oid: "string",
    },
    primaryIndex: { partitionKey: "oid" },
  });

  const AppGroup = new Table(stack, "AppGroup", {
    fields: {
      oid: "string",
    },
    primaryIndex: { partitionKey: "oid" },
  });

  //
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
    AppGroup,
    AppVersion,

    AppEntry,

    //
    usersTable,
  ];

  //------ WebSocket API ------//
  const auth = new Auth(stack, "auth", {
    authenticator: {
      environment: {
        PRODUCTION_SITE_URL: PRODUCTION_SITE_URL,
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
      "GET /session": "functions/session.handler",

      //
      "POST /import-map": "functions/import-map.handler",

      //
      "GET /bundle/{seg1}/{seg2}/{seg3}/{seg4}": "functions/bundle.handler",

      "POST /AppEntry-create": "functions/AppEntry.create",
      "POST /AppEntry-get": "functions/AppEntry.get",
      "POST /AppEntry-list": "functions/AppEntry.list",
      "POST /AppEntry-update": "functions/AppEntry.update",
      "POST /AppEntry-remove": "functions/AppEntry.remove",
      //

      "POST /AppVersion-create": "functions/AppVersion.create",
      "POST /AppVersion-get": "functions/AppVersion.get",
      "POST /AppVersion-list": "functions/AppVersion.list",
      "POST /AppVersion-update": "functions/AppVersion.update",
      "POST /AppVersion-remove": "functions/AppVersion.remove",
      //

      "POST /AppGroup-create": "functions/AppGroup.create",
      "POST /AppGroup-get": "functions/AppGroup.get",
      "POST /AppGroup-list": "functions/AppGroup.list",
      "POST /AppGroup-update": "functions/AppGroup.update",
      "POST /AppGroup-remove": "functions/AppGroup.remove",

      //

      // "POST /app-code-create": "functions/app-code.create",
      // "POST /app-code-get": "functions/app-code.get",
      // "POST /app-code-list": "functions/app-code.list",
      // "POST /app-code-update": "functions/app-code.update",
      // "POST /app-code-remove": "functions/app-code.remove",
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
