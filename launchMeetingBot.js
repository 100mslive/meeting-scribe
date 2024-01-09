import puppeteer from 'puppeteer-extra';
import UserPreferencesPlugin from 'puppeteer-extra-plugin-user-preferences';
import { Command } from 'commander';
import { PageAccess } from './adapter/PageAccess.js';
import { DEFAULT_DOWNLOADS_DIR, DEFAULT_OUTPUT_DIR } from './constant.js';
import { removeSpecialCharacter, wait, createDirIfNotExists } from './common.js';
import { concatenateFilesInDirectory } from './AVFileCreator.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function downloadUserLocation(downloadsDir) {
  return UserPreferencesPlugin({
    userPrefs: {
      download: {
        prompt_for_download: false,
        default_directory: downloadsDir,
      },
    },
  });
}

export const launchMeetingBot = async entryPoint => {
  const manageAVFilesName = {};
  const program = new Command();
  program.name('meeting-bot').description('Record audio and video tracks of each peer in a meeting');

  program
    .requiredOption('-u, --url <meeting_url>', 'meeting url to join (required)')
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
  const meetingLink = options.url;
  const outputDir = options.output_dir;
  const downloadsDir = options.downloads_dir;
  const interactiveModeEnabled = options.interactive;
  const headless = interactiveModeEnabled ? false : 'new';

  // create tmp directories
  createDirIfNotExists(outputDir);
  createDirIfNotExists(downloadsDir);

  puppeteer.use(downloadUserLocation(downloadsDir));
  const extensionPath = path.join(__dirname, 'ext');
  const launchOptions = {
    headless,
    defaultViewport: null,
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
    args: [
      '--no-first-run',
      '--start-maximized',
      '--no-default-browser-check',
      '--auto-accept-camera-and-microphone-capture',
      `--load-extension=${extensionPath}`,
    ],
  };

  // Use installed chrome for M1, use puppeteer chrome for testing otherwise
  if (process.arch.startsWith('arm')) {
    launchOptions.channel = 'chrome';
  }

  let browser;
  try {
    browser = await puppeteer.launch(launchOptions);
  } catch (e) {
    // This error should ideally come if chrome is not installed on M1 mac
    // For x64 arch, puppeteer's chrome-for-testing should work
    console.error(
      'Could not launch chrome on your machine. Please check if chrome is properly installed on your system.',
    );
    process.exit(1);
  }

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

  // Select existing page when browser opens instead of creating a new page
  const extPage = await browser.pages().then(e => e[0]);

  //Navigate to the page
  await extPage.goto(`chrome-extension://${extensionID}/${extensionEndURL}`);

  // load 100ms url
  const page = await browser.newPage();
  await page.bringToFront();
  await page.exposeFunction('__100ms_getExtensionId', () => {
    return extensionID;
  });
  await page.goto(meetingLink);

  if (!interactiveModeEnabled) {
    const pageAccess = new PageAccess(page);
    entryPoint.setPageAccess(pageAccess);
    await entryPoint.load();
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
        downloadsDir,
        `stream_${removeSpecialCharacter(data.streamId)}`,
        `track_${removeSpecialCharacter(data.trackId)}`,
        data.kind,
      );
      concatenateFilesInDirectory(trackFilePath, downloadFilePath);
    }
  });
};
