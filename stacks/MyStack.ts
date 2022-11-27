import { StackContext, Api, Auth, Table } from "@serverless-stack/resources";
import { DistributionForBucket } from "./UGC";

const GOOGLE_CLIENT_ID = `731023934508-nou9ruf23nu9h85s59gu7evr7qq7pkh9.apps.googleusercontent.com`;
const SiteURL = `https://agape.town`;

export function MyStack({ stack, app }: StackContext) {
  let stage = app.stage;
  let region = app.region;

  let ugc = new DistributionForBucket(stack, "UGC", {});

  const usersTable = new Table(stack, "users", {
    fields: {
      userId: "string",
    },
    primaryIndex: { partitionKey: "userId" },
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
          //!SECTION
        },
        bind: [usersTable],
      },
    },
    routes: {
      "GET /": "functions/lambda.handler",
      "GET /session": "functions/session.handler",
    },
  });

  const auth = new Auth(stack, "auth", {
    authenticator: {
      environment: {
        SiteURL: SiteURL,
        GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID,
      },
      handler: "functions/auth.handler",
    },
  });
  //
  auth.attach(stack, {
    api: api,
    prefix: "/auth",
  });

  stack.addOutputs({
    stage,
    region,
    ...ugc.envInfo,
    // PortalSiteURL: site.url,
    ApiEndpoint: api.url,
  });

  //
}

//
//
// https://82xi9xvuu6.execute-api.ap-southeast-1.amazonaws.com/auth/google/authorize
// https://82xi9xvuu6.execute-api.ap-southeast-1.amazonaws.com/auth/google/callback
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
