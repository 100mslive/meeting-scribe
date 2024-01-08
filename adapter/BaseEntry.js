export class BaseEntry {
  pageAccess;
  setPageAccess(pageAccess) {
    this.pageAccess = pageAccess;
  }
  async load() {}
}
