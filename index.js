import puppeteer from "puppeteer-extra";
import { Command } from "commander";
import UserPreferencesPlugin from "puppeteer-extra-plugin-user-preferences";

import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

const manageAVFilesName = {};
const DOWNLOAD_DIRECTORY = '/Users/amar_1995/myAwesomeDownloadFolder';
function concatenateFilesInDirectory(directoryPath, targetFilePath) {
    const directoryCheckInterval = setInterval(() => {
      if (fs.existsSync(directoryPath)) {
        console.log(`Directory found: ${directoryPath}`);

        // Stop checking for the directory
        clearInterval(directoryCheckInterval);

        // Initial concatenation of existing files
        concatenateExistingFiles(directoryPath, targetFilePath);

        // Watch the directory for added or changed files
        const watcher = chokidar.watch(directoryPath, { ignored: /^\./, persistent: true });

        watcher.on('add', filePath => {
            if (!filePath.endsWith('crdownload')) {
              console.log(`File ${filePath} has been added`);
              setTimeout(() => {
                appendFileContent(filePath, targetFilePath)
              }, 1000)
            }
        })
      }
    })

}

function concatenateExistingFiles(directoryPath, targetFilePath) {
    fs.readdir(directoryPath, (err, files) => {
        if (err) throw err;

        // Clear the target file before appending
        fs.writeFileSync(targetFilePath, '');

        files.forEach(file => {
            const filePath = path.join(directoryPath, file);
            appendFileContent(filePath, targetFilePath);
        });
    });
}

function appendFileContent(sourceFilePath, targetFilePath) {
    const content = fs.readFileSync(sourceFilePath);
    fs.appendFileSync(targetFilePath, content);
}
// wait in millisec
function wait(time = 1000) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

function downloadUserLocation() {
  return UserPreferencesPlugin({
    userPrefs: {
      download: {
        prompt_for_download: false,
        default_directory: DOWNLOAD_DIRECTORY,
      }
    },
  });
}
(async () => {
  const program = new Command();
  program
    .name('meeting-bot')
    .description('Record audio and video tracks of each peer in a meeting');

  program
    .requiredOption('-u, --url <meeting_url>', 'meeting url to join') 
    .option('-o, --output_dir <dir>', 'directory to store recordings', process.cwd())

  program.parse()
  const options = program.opts()
  const meetingLink = options.url;
  const outputDir = options.output_dir;

  puppeteer.use(downloadUserLocation());
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: false,
    defaultViewport: null,
    ignoreDefaultArgs: ["--disable-extensions","--enable-automation"],
    args: [
      '--no-first-run',
      '--start-maximized',
      '--no-default-browser-check',
      '--auto-accept-camera-and-microphone-capture',
      '--load-extension=ext',
    ]
  });
  // wait for browser to load
  await wait(2000);
  // Find the extension
  const targets = browser.targets();
  const extensionTarget = targets.find(target => {
    return target.type() === "service_worker"
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
  await page.exposeFunction("__100ms_getExtensionId", () => {
    return extensionID;
  });
  await page.goto(meetingLink);
  // js me global variable ---- 
  await page.locator("input").fill("bot");
  const joinButton = await page.waitForSelector('div >>> ::-p-text("Join")');
  await joinButton.click();
  if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
  } 
  await page.exposeFunction('__100ms_onMessageReceivedEvent', data  => {
    try {
      data = JSON.parse(data);
    } catch(e) {

    }
    if (!data.streamId) {
      // if no streamId sent by the vendor
      data.streamId = 'stream_data';
    }
    if (!manageAVFilesName[data.trackId] && data.action === 'AVTracksAdded') {
      manageAVFilesName[data.trackId] = {kind: data.kind, streamId: data.streamId};
      const downloadFileDirPath = path.join(outputDir, data.trackId);
      if (!fs.existsSync(downloadFileDirPath)) {
        fs.mkdirSync(downloadFileDirPath);
      }
      const downloadFilePath = path.join(downloadFileDirPath, `${data.kind}.webm`);
      const trackFilePath = path.join(DOWNLOAD_DIRECTORY, data.streamId, data.trackId, data.kind);
      concatenateFilesInDirectory(trackFilePath, downloadFilePath);
    }
  });
})();
