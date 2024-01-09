#!/usr/bin/env node
import { BaseEntry } from './adapter/BaseEntry.js';
import { launchMeetingBot } from './launchMeetingBot.js';

// this what user needs to do
class EntryPoint100ms extends BaseEntry {
  async load() {
    await this.pageAccess.waitForSelector('input');
    await this.pageAccess.type('input', 'Bot');
    const joinButton = await this.pageAccess.waitForSelector('div >>> ::-p-text("Join")');
    await joinButton.click();
  }
}

const start = async () => {
  const entryPoint = new EntryPoint100ms();
  await launchMeetingBot(entryPoint);
};

start();
