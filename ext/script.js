chrome.runtime.onMessageExternal.addListener(async function (message, sender, sendResponse) {
  if (message.action === "uploadFile" && message.data) {
    // filename = `stream_${message.streamId}/track_${message.trackId}/${message.kind}/${Date.now()}.webm`
    filename = `stream_data/track_data/${message.kind}/${Date.now()}.webm`
    chrome.downloads.download(options={
      url: message.data,
      filename,
      saveAs: false,
      conflictAction: "uniquify",
    })
  }
  const data = message.data;
  // if (message[0] !== 'WebRTCExternals') return;
  const p = document.createElement("p");
  p.append(data);
  const logDiv = document.getElementById("log");
  logDiv.appendChild(p);
});

// chrome.storage.local.get(['uploadedBlob'], function(result) {
//   if (!result) return;
//   console.log("blob ", result);
// });
console.log("loaded");

/**.
  

 */