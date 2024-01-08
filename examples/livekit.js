import { BaseEntry } from '../adapter/BaseEntry.js';
import { launchMeetingBot } from '../launchMeetingBot.js';

// this what user needs to do
class EntryPointLiveKit extends BaseEntry {
  async load() {
    await this.pageAccess.waitForSelector('.lk-username-container');
    await this.pageAccess.type('input', 'Bot');
    const joinButton = await this.pageAccess.waitForSelector('.lk-username-container > button');
    await joinButton.click();
  }
}

const start = async () => {
  const entryPoint = new EntryPointLiveKit();
  await launchMeetingBot(entryPoint);
};

start();
