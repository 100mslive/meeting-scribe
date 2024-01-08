import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

export const concatenateFilesInDirectory = (directoryPath, targetFilePath) => {
  console.log('directpath ', directoryPath);

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
            appendFileContent(filePath, targetFilePath);
          }, 1000);
        }
      });
    }
  });
};

const concatenateExistingFiles = (directoryPath, targetFilePath) => {
  fs.readdir(directoryPath, (err, files) => {
    if (err) throw err;

    // Clear the target file before appending
    fs.writeFileSync(targetFilePath, '');

    files.forEach(file => {
      const filePath = path.join(directoryPath, file);
      appendFileContent(filePath, targetFilePath);
    });
  });
};

const appendFileContent = (sourceFilePath, targetFilePath) => {
  const content = fs.readFileSync(sourceFilePath);
  fs.appendFileSync(targetFilePath, content);
};
