import fs from 'fs';

// wait in millisec
export const wait = (time = 1000) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

export const removeSpecialCharacter = text => {
  const specicalCharacter = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
  specicalCharacter.forEach(char => (text = text.replaceAll(char, '')));
  return text;
};

export const createDirIfNotExists = dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};
