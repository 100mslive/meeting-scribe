// this what user needs to do
class MeetingScribeLiveKit {
  pageAccess;
  setPageAccess(pageAccess) {
    this.pageAccess = pageAccess;
  }
  async onLoad() {
    await this.pageAccess.waitForSelector('.lk-username-container');
    await this.pageAccess.type('input', 'Bot');
    const joinButton = await this.pageAccess.waitForSelector('.lk-username-container > button');
    await joinButton.click();
  }
}

module.exports = {
  'livekit-example': MeetingScribeLiveKit,
};
