# Meeting-Scribe

Meeting-Scribe is a powerful, yet experimental, tool designed for joining WebRTC-based calls seamlessly. Its primary functionality includes recording individual audio and video tracks during online meetings. Currently in its developmental phase, it offers a glimpse into the potential of automated meeting recordings. This tool is best suited for developers, tech enthusiasts, and early adopters who are interested in exploring new technologies in the realm of online communication.

**NOTE**: This tool is still in experimental stage, and hence not meant for production usage yet. Things may break, and the interface may change without supporting backward compatibility.

## Prerequisites

- Need to have chrome installed on your system

## Caveats

- There will be no recording for the bot peer.
- In interactive mode, don't use the launched chrome instance for joining as remote peers.

## Features

- **Join WebRTC Calls:** Easily join any WebRTC-based meeting with a simple command.
- **Individual Track Recording:** Records and stores individual audio and video tracks for each participant.
- **Easy Installation:** Quick and straightforward setup process.
- **CLI Support:** Easy-to-use CLI for quick interactions.

## Installation

To install Meeting-Scribe, follow these steps:

1. Clone the repository:
   ```bash
   git clone git@github.com:100mslive/meeting-scribe.git
   ```
2. Change to the directory:
   ```bash
   cd meeting-scribe
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Install the tool itself (Optional):
   ```bash
   npm install .
   ```

## Usage

After installation, you can run Meeting-Scribe from any directory using the following command:

```bash
meeting-scribe -u https://amar-livestream-641.app.100ms.live/streaming/meeting/dcm-zlrx-pee -va 100ms
```

OR, just run the `index.js` file if you skipped the optional step 4. above

```bash
node index.js --url <MEETING_URL>
```

### Command Line Options

- `-u, --url`: The meeting URL to join (required)

- `-va, --vendor-adapter`: This is used to load default vendors like, 100ms, livekit. If you create your own vendor please add the class name as vendor adapter

- `-f, --loader-file`: This need to have a location of a loader js file. It must contain class which need to passed to vendor adapter

- `-o, --output-dir`: The directory to store recordings. It will contain final audio/video recording data for every track in a meeting. (default: `$cwd/meeting-scribe/output`)

- `-d, --downloads-dir`: The directory used by the browser as its default downloads directory. Our extension will download audio/video data periodically inside this directory. (default: `$cwd/meeting-scribe/downloads`)

- `-i, --interactive`: By default, the browser opens in headless mode and the meeting-scribe joins the call automatically. But, this functionality is not supported for all vendors yet. Check [Available Adapters](#available-adapters) to know about which vendors are supported in headless mode currently. So, for other vendors, it is desirable that the bot at least opens up the given meeting link without performing any UI interaction like filling up the participant name, clicking on the Join button, etc. The user can then manually do the UI interactions to allow the bot to join the meeting. After joining, the bot can start recording as soon as remote peers are available in the call (Please ensure that remote peers do not join the meeting from the same browser instance from which the bot has joined the call). To enable such interactive mode, use this option.

- `-h, --help`: Print help on the command line.

To see all available options:

```bash
meeting-scribe --help
```

## Concepts

### Adapters

meeting-scribe uses the concept of adapters to join meetings for any specific vendor. To support new vendors (like Teams, Google Meet, etc.), one needs to write the adapter for that particular vendor. To write new adapter please check examples.

### Available Adapters

Vendor | Bash Script
--- | --- 
100ms   | meeting-scribe -u <YOUR_100ms_URL> -va 100ms
livekit | meeting-scribe -u <YOUR_Livekit_URL> -va livekit

### How to create your own vendor runner

Create your own adapter file which contain a class with two mandatory methods. Below is a template.

```js
// this what user needs to add
class VendorLoader {
  pageAccess; // puppeteer page of loaded url
  setPageAccess(pageAccess) {
    this.pageAccess = pageAccess;
  }
  async onLoad() {
    // your automation loader code goes here
    // this will responsible to join room
  }
}

module.exports = {
  VendorLoader,
};
```

Running your own vendor execution code.

```bash
meeting-scribe --url <YOUR_VENDOR_MEETING_URL> -f <FILE_PATH> -va <VENDOR_CODE_CLASSNAME || VendorLoader>
```

## Support & Contributions

For support, feature requests, or contributions, please open an issue or pull request in the GitHub repository.

## License

100ms meeting scribe is licensed under Apache License v2.0.
