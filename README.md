# Meeting-Bot

Meeting-Bot is a powerful, yet experimental, tool designed for joining WebRTC-based calls seamlessly. Its primary functionality includes recording individual audio and video tracks during online meetings. Currently in its developmental phase, it offers a glimpse into the potential of automated meeting recordings. This tool is best suited for developers, tech enthusiasts, and early adopters who are interested in exploring new technologies in the realm of online communication.

**NOTE**: This tool is still in experimental stage, and hence not meant for production usage yet. Things may break, and the interface may change without supporting backward compatibility.

## Features

- **Join WebRTC Calls:** Easily join any WebRTC-based meeting with a simple command.
- **Individual Track Recording:** Records and stores individual audio and video tracks for each participant.
- **Easy Installation:** Quick and straightforward setup process.
- **CLI Support:** Easy-to-use CLI for quick interactions.

## Installation

To install Meeting-Bot, follow these steps:

1. Clone the repository:
    ```bash
    git clone git@github.com:100mslive/meeting-bot.git
    ```
2. Change to the directory:
    ```bash
    cd meeting-bot
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

After installation, you can run Meeting-Bot from any directory using the following command:

```bash
meeting-bot --url "<meeting_url>"
```
OR, just run the `index.js` file if you skipped the optional step 4. above
```bash
node index.js --url "meeting_url"
```

### Command Line Options

- `-u, --url`: The meeting URL to join (required)

- `-o, --output_dir`: The directory to store recordings (default: `$cwd/meeting-bot/output`)

- `-d, --downloads_dir`: The directory used by the browser as its default downloads directory (default: `$cwd/meeting-bot/downloads`)

- `-i, --interactive`: By default, the browser opens in headless mode and the meeting-bot joins the call automatically. But, this functionality is not supported for all vendors yet. Check [Available Adapters](#available-adapters) to know about which vendors are supported in headless mode currently. So, for other vendors, it is desirable that the bot at least opens up the given meeting link without performing any UI interaction like filling up the participant name, clicking on the Join button, etc. The user can then manually do the UI interactions to allow the bot to join the meeting. After joining, the bot can start recording as soon as remote peers are available in the call (Please ensure that remote peers do not join the meeting from the same browser instance from which the bot has joined the call). To enable such interactive mode, use this option.

- `-h, --help`: Print help on the command line.

To see all available options:

```bash
meeting-bot --help
```

## Concepts

### Adapters
meeting-bot uses the concept of adapters to join meetings for any specific vendor. An adapter written for a particular vendor (like 100ms) is an interface to define methods on how to join meetings of that particular vendor. To support new vendors (like Teams, Google Meet, etc.), one needs to write the adapter for that particular vendor.

### Available Adapters
1. 100ms
2. LiveKit

## Examples

### Joining a LiveKit Meeting

To join a LiveKit meeting and save the output:

```bash
node examples/livekit.js --url "https://meet.livekit.io/rooms/mxqh-7skt" -o output
```

## Support & Contributions

For support, feature requests, or contributions, please open an issue or pull request in the GitHub repository.

## License

[Specify License Here]
