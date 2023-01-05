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

  const followingTable = new Table(stack, "myfollowing", {
    fields: {
      oid: "string", // randID
      userID: "string",
      followingUserID: "string",
      followBackCache: "string",
    },
    primaryIndex: { partitionKey: "oid" },
  });

  //

  const sitesTable = new Table(stack, "mysites", {
    fields: {
      oid: "string", // randID
      slug: "string",
      userID: "string",
      createdAt: "string",
    },
    primaryIndex: { partitionKey: "oid" },
  });

  const customdoaminsTable = new Table(stack, "mycustomdoamins", {
    fields: {
      //
      oid: "string", // randID
      slug: "string", //
      userID: "string",
      siteID: "string",
      createdAt: "string",
    },
    primaryIndex: { partitionKey: "oid" },
  });

  const metapagesTable = new Table(stack, "mymetapages", {
    fields: {
      //
      oid: "string", // randID
      slug: "string", //
      userID: "string",
      siteID: "string",
      createdAt: "string",
      seo: "binary",
    },
    primaryIndex: { partitionKey: "oid" },
  });

  const sitemediaTable = new Table(stack, "mysitemedia", {
    fields: {
      //
      oid: "string", // randID
      slug: "string", //
      userID: "string",
      siteID: "string",
      createdAt: "string",
      seo: "binary",
      ugcBucket: "string",
      ugcCDN: "string",
      ugcS3Link: "string",
      ugcCDNLink: "string",
    },
    primaryIndex: { partitionKey: "oid" },
  });

  const myTables = [
    sitemediaTable,
    metapagesTable,
    customdoaminsTable,
    sitesTable,
    usersTable,
    followingTable,
  ];

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
      //
      "GET /": "functions/discovery.handler",
      "GET /script": "functions/script.handler",
      "POST /import-map": "functions/import-map.handler",
      "GET /session": "functions/session.handler",

      //
      "POST /site-id-taken": "functions/site-id-taken.handler",

      //
      "POST /site-create": "functions/site-create.handler",
      "POST /site-recent": "functions/site-recent.handler",
      "POST /site-get": "functions/site-get.handler",
      "POST /site-domain-add": "functions/site-domain-add.handler",
      "POST /site-domain-remove": "functions/site-domain-remove.handler",
      "POST /site-domain-list-mine": "functions/site-domain-list-mine.handler",

      //
      "POST /site-page-create": "functions/site-page-create.handler",
      "POST /site-page-list-mine": "functions/site-page-list-mine.handler",
      "POST /site-page-remove": "functions/site-page-remove.handler",
      "POST /site-page-update": "functions/site-page-update.handler",

      //
      "POST /seo-subdomain-site": "functions/seo-subdomain-site.handler",
      "POST /seo-userdomain-site": "functions/seo-userdomain-site.handler",
      "POST /seo-site-page": "functions/seo-site-page.handler",
      "POST /seo-page-get": "functions/seo-page-get.handler",

      //
      "POST /effectnode": "functions/effectnode.handler",
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
