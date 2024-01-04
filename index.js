import puppeteer from "puppeteer-core";
import { Command } from "commander";

import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

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

(async () => {
  const program = new Command();
  program
    .name('meeting-bot')
    .description('Record audio and video tracks of each peer in a meeting');

  program
    .option('-u, --url <meeting_url>', 'meeting url to join')

  program.parse()
  const options = program.opts()
  const meetingLink = options.url;

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
      '--load-extension=ext'
    ]
  })
  const page = await browser.pages().then(e => e[0]);

  await page.goto(meetingLink)
  await page.locator("input").fill("bot")
  const joinButton = await page.waitForSelector(
    'div >>> ::-p-text("Join")'
  )

  // Find the extension
  const targets = await browser.targets();
  const extensionTarget = targets.find(target => {
    return target.type() === "service_worker"
  });

  // Extract the URL
  const extensionURL = extensionTarget.url();
  const urlSplit = extensionURL.split('/');
  const extensionID = urlSplit[2];

  // Define the extension page
  const extensionEndURL = 'index.html';

  //Navigate to the page
  const extPage = await browser.newPage();
  await extPage.goto(`chrome-extension://${extensionID}/${extensionEndURL}`);

  await page.bringToFront();
  await joinButton.click();

  concatenateFilesInDirectory("/Users/shubham/Downloads/stream_data/track_data/audio/", "./final_audio.webm")
  concatenateFilesInDirectory("/Users/shubham/Downloads/stream_data/track_data/video/", "./final_video.webm")
})();
