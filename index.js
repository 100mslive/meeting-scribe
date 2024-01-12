#!/usr/bin/env node
import fs from 'fs';
import { DEFAULT_DOWNLOADS_DIR, DEFAULT_OUTPUT_DIR } from './constant.js';
import { launchMeetingBot } from './launchMeetingBot.js';

import { Command } from 'commander';

const start = async () => {
  const program = new Command();
  program.name('meeting-bot').description('Record audio and video tracks of each peer in a meeting');

  program
    .requiredOption('-u, --url <meeting_url>', 'meeting url to join (required)')
    .requiredOption('-exe, --external-file <external-file>', 'external file location, it need to have a class')
    .requiredOption(
      '-v, --vendor <vendor>',
      'vendor object file, it needs to match with the class name of external file.',
    )
    .option('-o, --output_dir <dir>', 'directory to store recordings', DEFAULT_OUTPUT_DIR)
    .option(
      '-d, --downloads_dir <downloads_dir>',
      'directory used by browser as downloads directory',
      DEFAULT_DOWNLOADS_DIR,
    )
    .option(
      '-i, --interactive',
      'browser will open the meeting link, but not try to automatically join the call. This option allows the ' +
        'user to join the call after logging in or to perform other required UI actions needed before joining the ' +
        'call. This is useful for vendors for which we do not have automated adapters yet.',
    );

  program.parse();
  const options = program.opts();
  const execution_location = options.externalFile;
  if (fs.existsSync(execution_location)) {
    const externalPoint = await import(execution_location);
    // reading from outer file
    if (externalPoint.default && externalPoint.default[options.vendor]) {
      const entryPoint = new externalPoint.default[options.vendor]();
      await launchMeetingBot(entryPoint, options);
    } else {
      await launchMeetingBot(null, options);
    }
  } else {
    await launchMeetingBot(null, options);
  }
};

start();
