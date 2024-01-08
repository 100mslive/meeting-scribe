import puppeteer from 'puppeteer-extra';
import UserPreferencesPlugin from 'puppeteer-extra-plugin-user-preferences';
import { Command } from 'commander';
import { PageAccess } from './adapter/PageAccess.js';
import { DOWNLOAD_DIRECTORY } from './constant.js';
import { removeSpecialCharacter, wait } from './common.js';
import { concatenateFilesInDirectory } from './AVFileCreator.js';

import fs from 'fs';
import path from 'path';

function downloadUserLocation(downloadsDir) {
  return UserPreferencesPlugin({
    userPrefs: {
      download: {
        prompt_for_download: false,
        default_directory: path.join(path.resolve(), downloadsDir),
      },
    },
  });
}

export const launchMeetingBot = async entryPoint => {
  const manageAVFilesName = {};
  const program = new Command();
  program.name('meeting-bot').description('Record audio and video tracks of each peer in a meeting');

  program
    .requiredOption('-u, --url <meeting_url>', 'meeting url to join')
    .option('-o, --output_dir <dir>', 'directory to store recordings', process.cwd())
    .option(
      '-d, --downloads_dir <downloads_dir>',
      'directory used by browser as downloads directory',
      DOWNLOAD_DIRECTORY,
    )
    .option('-h, --headless', 'browser will run in headless mode if this flag is used')

  program.parse();
  const options = program.opts();
  const meetingLink = options.url;
  const outputDir = options.output_dir;
  const downloadsDir = options.downloads_dir;
  const headless = options.headless ? "new" : false;

  puppeteer.use(downloadUserLocation(downloadsDir));
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless,
    defaultViewport: null,
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
    args: [
      '--no-first-run',
      '--start-maximized',
      '--no-default-browser-check',
      '--auto-accept-camera-and-microphone-capture',
      '--load-extension=ext',
    ],
  });
  // wait for browser to load
  await wait(2000);
  // Find the extension
  const targets = browser.targets();
  const extensionTarget = targets.find(target => {
    return target.type() === 'service_worker';
  });
  // Extract the URL
  const extensionURL = extensionTarget.url();
  const urlSplit = extensionURL.split('/');
  const extensionID = urlSplit[2];
  // Define the extension page
  const extensionEndURL = 'index.html';
  // const extPage = await browser.pages().then(e => e[0]);
  const extPage = await browser.newPage();
  //Navigate to the page
  await extPage.goto(`chrome-extension://${extensionID}/${extensionEndURL}`);

  // load 100ms url
  const page = await browser.newPage();
  await page.bringToFront();
  await page.exposeFunction('__100ms_getExtensionId', () => {
    return extensionID;
  });
  await page.goto(meetingLink);

  const pageAccess = new PageAccess(page);
  entryPoint.setPageAccess(pageAccess);
  // js me global variable ----
  await entryPoint.load();
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  await page.exposeFunction('__100ms_onMessageReceivedEvent', data => {
    try {
      data = JSON.parse(data);
    } catch (e) {}
    if (!data.streamId) {
      // if no streamId sent by the vendor
      data.streamId = 'data';
    }
    if (!manageAVFilesName[data.trackId] && data.action === 'AVTracksAdded') {
      manageAVFilesName[data.trackId] = { kind: data.kind, streamId: data.streamId };
      const downloadFileDirPath = path.join(outputDir, removeSpecialCharacter(data.trackId));
      if (!fs.existsSync(downloadFileDirPath)) {
        fs.mkdirSync(downloadFileDirPath);
      }
      const downloadFilePath = path.join(downloadFileDirPath, `${data.kind}.webm`);
      const trackFilePath = path.join(
        path.resolve(),
        downloadsDir,
        `stream_${removeSpecialCharacter(data.streamId)}`,
        `track_${removeSpecialCharacter(data.trackId)}`,
        data.kind,
      );
      concatenateFilesInDirectory(trackFilePath, downloadFilePath);
    }
  });
};
