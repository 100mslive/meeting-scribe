export class PageAccess {
  #page;
  constructor(page) {
    this.#page = page;
  }
  // add minimum method exposed, way to block access to pages
  async waitForSelector(selector, options = {}) {
    return this.#page.waitForSelector(selector, options);
  }

  async waitForNavigation(options = {}) {
    return this.#page.waitForNavigation(options);
  }

  async waitForFunction(pageFunction, options = {}, ...args) {
    return this.#page.waitForFunction(pageFunction, options, args);
  }
  async select(selector, ...values) {
    return this.#page.select(selector, values);
  }

  async click(selector, options = {}) {
    return this.#page.click(selector, options);
  }

  async type(selector, text) {
    return this.#page.type(selector, text);
  }
  // need to implemented, as currently no abstract function is
  async load() {}
}
