type Resources = {
  //
  query: Object;
  bodyRaw: string | undefined;
  session: Object;
  headers: Object;
  path: string[] | undefined;
  isLoggedIn: Function;
};

export class EffectNodeREST {
  resources: {};
  constructor({ resources = <Resources>{} }) {
    //
    this.resources = resources;
  }
  async work() {
    //
  }
}
