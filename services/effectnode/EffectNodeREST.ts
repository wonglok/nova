import { SessionValue } from "@serverless-stack/node/auth";

type Resources = {
  //
  query: Object;
  bodyRaw: string | undefined;
  session: SessionValue;
  headers: Object;
  path: string[] | undefined;
  isLoggedIn: Function;
};

export class EffectNodeREST {
  resources: Resources;
  state: {};
  response: { statusCode: number; body: string };
  constructor({ resources = <Resources>{} }) {
    //
    this.resources = resources;

    this.state = {};

    this.response = {
      statusCode: 200,
      body: JSON.stringify({ reply: {} }),
    };
  }
  async realWork() {
    //

    if (this.resources.isLoggedIn()) {
      this.resources.session;
    }

    //

    //
  }
  async work() {
    try {
      await this.realWork();
    } catch (e: any) {
      this.response.statusCode = e.statusCode;
      this.response.body = JSON.stringify({ message: e.message });
    }
  }
}
