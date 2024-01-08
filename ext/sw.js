const trackRecorders = {};
const trackRecordedData = {};
const storeFiles = {};
let extensionId = 'kcblbddelnmgapihhgimefdhpfgbpndl';

const addTrack = (track, streamId) => {
  if (track.id && !trackRecorders?.[track.id]) {
    const stream = new MediaStream([track]);
    trackRecorders[track.id] = new MediaRecorder(stream, {
      mimeType: track.kind === 'audio' ? 'audio/webm' : 'video/webm',
    });
    trackRecordedData[track.id] = [];
    trackRecorders[track.id].ondataavailable = async event => {
      /* add the data to the recordedDataArray */
      const blob = new Blob([event.data], { type: `${track.kind}/webm` });
      const raw = await convertBlobToBase64(blob);
      chrome.runtime.sendMessage(
        extensionId,
        (message = { action: 'uploadFile', data: raw, streamId: streamId, trackId: track.id, kind: track.kind }),
      );
    };
    // send message to puppeteer
    sendMessageToPuppeteer(
      (message = { action: 'AVTracksAdded', streamId: streamId, trackId: track.id, kind: track.kind }),
    );
    trackRecorders[track.id].start(2000);
    // recorders[stream.id].onstop = () => createFileFormCurrentRecordedData(stream.id);
  } else {
  }
};

const removeTrack = track => {
  if (track.kind && trackRecorders?.[track.id]) {
    trackRecorders[track.id].stop();
    delete trackRecorders[track.id];
    sendMessageToPuppeteer((message = { action: 'AVTracksRemoved', trackId: track.id, kind: track.kind }));
  }
};

// use it for whole chunck of file, currently not being used
async function createTrackFileFormCurrentRecordedData(id, type) {
  if (!trackRecordedData[id]) return;
  const blob = new Blob(trackRecordedData[id], { type: `${type}/webm` });
  const raw = await convertBlobToBase64(blob);
  chrome.runtime.sendMessage(
    extensionId,
    (message = { action: 'uploadFile', message: raw, id }),
    (callback = () => {
      delete trackRecordedData[id];
    }),
  );
}

const convertBlobToBase64 = blob =>
  new Promise(resolve => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result;
      resolve(base64data);
    };
  });

var inject = function () {
  function trace(method, args) {
    window.postMessage(['WebRTCExternals', method, JSON.stringify(args || {})], '*');
  }

  var origPeerConnection = window.RTCPeerConnection;
  if (!origPeerConnection) {
    return; // can happen e.g. when peerconnection is disabled in Firefox.
  }

  window.RTCPeerConnection = function () {
    var pc = new origPeerConnection(arguments[0], arguments[1]);

    pc.addEventListener('addstream', function (e) {
      e.stream.addEventListener('removetrack', event => {
        removeTrack(event.track);
        trace('onstreamremovetrack', event.track?.kind + ': ' + event.track?.id);
      });
      trace(
        'onaddstream',
        e.stream.id +
          ' ' +
          e.stream.getTracks().map(function (t) {
            return t.kind + ':' + t.id;
          }),
      );
    });
    pc.addEventListener('removestream', function (e) {
      trace(
        'onremovestream',
        e.stream.id +
          ' ' +
          e.stream.getTracks().map(function (t) {
            return t.kind + ':' + t.id;
          }),
      );
    });
    pc.addEventListener('track', function (e) {
      // not need
      e.track.addEventListener('ended', ev => {
        trace('ontrackended', e.track.kind + ': ' + e.track.muted + ': ' + e.track.enabled + ':' + e.track.id);
      });
      // to pause the mediarecordor
      e.track.addEventListener('mute', ev => {
        trace(
          'ontrackmuted',
          e.track.kind + ' muted: ' + e.track.muted + ' enbled: ' + e.track.enabled + ':' + e.track.id,
        );
      });
      // to unpause the mediarecordor
      e.track.addEventListener('unmute', ev => {
        trace('ontrackunmuted', e.track.kind + ': ' + e.track.muted + ': ' + e.track.enabled + ':' + e.track.id);
      });
      addTrack(e.track, e.streams?.[0]?.id);
      trace(
        'ontrack',
        e.track.kind +
          ': ' +
          e.track.muted +
          ': ' +
          e.track.enabled +
          ':' +
          e.track.id +
          ' ' +
          e.streams.map(function (s) {
            return 'stream:' + s.id;
          }),
      );
    });
    return pc;
  };

  window.RTCPeerConnection.prototype = origPeerConnection.prototype;
};

window.addEventListener('message', async event => {
  if (event.data[0] !== 'WebRTCExternals') return;
  // Make a simple request:
  chrome.runtime?.sendMessage(extensionId, (message = { action: 'log', data: event.data }));
});

(async () => {
  if (window.__100ms_getExtensionId) {
    const extension = await __100ms_getExtensionId?.();
    extensionId = extension;
  }
  inject();
})();

const sendMessageToPuppeteer = async message => {
  if (window.__100ms_onMessageReceivedEvent) {
    await __100ms_onMessageReceivedEvent(JSON.stringify(message));
  }
};
