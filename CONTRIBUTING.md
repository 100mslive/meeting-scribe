To setup meeting-scribe for development, follow these steps:

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
   npm install -g .
   ```

## Usage

After installation, you can run Meeting-Scribe from any directory using the following command:

```bash
meeting-scribe -u https://amar-livestream-641.app.100ms.live/streaming/meeting/dcm-zlrx-pee -va 100ms
```

**Note**: Above is a sample meeting url, please login to [100ms](https://dashboard.100ms.live/) to create your own meeting room.

OR, if you skipped the optional step 4. above 
```bash
node index.js --url <MEETING_URL>
```

## Issues and Feature Requests

Please use the respective templates for raising bugs and feature requests.
