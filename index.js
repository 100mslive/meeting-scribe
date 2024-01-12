#!/usr/bin/env node
import fs from 'fs';
import { DEFAULT_DOWNLOADS_DIR, DEFAULT_OUTPUT_DIR } from './constant.js';
import { launchMeetingScribe } from './launchMeetingScribe.js';

import { Command } from 'commander';
import { loaders } from './core/loader.js';

const start = async () => {
  const program = new Command();
  program.name('meeting-scribe').description('Record audio and video tracks of each peer in a meeting');

  program
    .requiredOption('-u, --url <meeting_url>', 'meeting url to join (required)')
    .option(
      '-vk, --vendor-key <vendor-key>',
      'vendor object file, it needs to match with the class name of external file or default supported key.' + 
      'Default supported key are 100ms, livekit',
    )
    .option('-f, --loader-file <loader-file>', 'external loader file location, it need to have a class')
    .option('-o, --output-dir <dir>', 'directory to store recordings', DEFAULT_OUTPUT_DIR)
    .option(
      '-d, --downloads-dir <downloads-dir>',
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
  const execution_location = options.loaderFile;
  options.interactive = typeof options.vendorKey === 'undefined';
  if (fs.existsSync(execution_location)) {
    const externalPoint = await import(execution_location);
    // reading from outer file
    if (externalPoint.default && externalPoint.default[options.vendorKey]) {
      const entryPoint = new externalPoint.default[options.vendorKey]();
      await launchMeetingScribe(entryPoint, options);
    } else {
      // if no loader found
      options.interactive = true;
      await launchMeetingScribe(null, options);
    }
    return;
  } 
  if (options.vendorKey && loaders[options.vendorKey]) {
    const entryPoint = new loaders[options.vendorKey]();
    await launchMeetingScribe(entryPoint, options);
    return;
  }
  await launchMeetingScribe(null, options);
};

start();
