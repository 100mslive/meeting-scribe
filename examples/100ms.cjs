// this what user needs to do
class MeetingBot100ms {
  pageAccess;
  setPageAccess(pageAccess) {
    this.pageAccess = pageAccess;
  }
  async onLoad() {
    await this.pageAccess.waitForSelector('input');
    await this.pageAccess.type('input', 'Bot');
    const joinButton = await this.pageAccess.waitForSelector('div >>> ::-p-text("Join")');
    await joinButton.click();
  }
}

module.exports = {
  MeetingBot100ms,
};
