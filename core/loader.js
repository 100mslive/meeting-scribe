class MeetingScribe100ms {
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

export const loaders = {
  '100ms': MeetingScribe100ms,
  'livekit': MeetingScribeLiveKit,
}