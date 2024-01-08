const removeSpecialCharacter = text => {
  const specicalCharacter = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
  specicalCharacter.forEach(char => (text = text.replaceAll(char, '')));
  return text;
};
chrome.runtime.onMessageExternal.addListener(async function (message, sender, sendResponse) {
  if (message.action === 'uploadFile' && message.data) {
    const streamId = message.streamId;
    const trackId = message.trackId;
    const kind = message.kind;
    filename = `stream_${streamId ? removeSpecialCharacter(streamId) : 'data'}/track_${removeSpecialCharacter(
      trackId,
    )}/${kind}/${Date.now()}.webm`;
    chrome.downloads.download(
      (options = {
        url: message.data,
        filename,
        saveAs: false,
        conflictAction: 'uniquify',
      }),
    );
  }
  const data = message.data;
  if (message.action !== 'log') return;
  const p = document.createElement('p');
  p.append(data);
  const logDiv = document.getElementById('log');
  logDiv.appendChild(p);
});

console.log('loaded');
