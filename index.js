import puppeteer from "puppeteer";
import { Command } from "commander";

import fs from 'fs';
import path from 'path';
import { concatenateFilesInDirectory } from "./utils.js";

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

  const launchOptions = {
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
  }

  // if (process.arch.startsWith('arm')) {
  //   launchOptions.channel = "chrome"
  // }

  const browser = await puppeteer.launch(launchOptions)
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

  if (!fs.existsSync(outputDir)){
      fs.mkdirSync(outputDir);
  }

  const audioFilePath = path.join(outputDir, 'audio.webm')
  const videoFilePath = path.join(outputDir, 'video.webm')

  concatenateFilesInDirectory("/Users/shubham/Downloads/stream_data/track_data/audio/", audioFilePath);
  concatenateFilesInDirectory("/Users/shubham/Downloads/stream_data/track_data/video/", videoFilePath);
})();
