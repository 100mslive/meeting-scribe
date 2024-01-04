const trackRecorders = {};
const trackRecordedData = {};
const storeFiles = {};
const extensionId = "blcfjgfciepafcoalociaengodngdegl"

const addTrack = (track) => {
  if (track.id && !trackRecorders?.[track.id]) {
    const stream = new MediaStream([track]);
    trackRecorders[track.id] = new MediaRecorder(stream, {mimeType: track.kind === 'audio' ? 'audio/webm' : 'video/webm'});
    trackRecordedData[track.id] = [];
    trackRecorders[track.id].ondataavailable = async (event) => {
      /* add the data to the recordedDataArray */
      const blob = new Blob([event.data], {type: `${track.kind}/webm`})
      const raw = await convertBlobToBase64(blob);
      chrome.runtime.sendMessage(extensionId, message={action: 'uploadFile', data: raw, streamId: stream.id, trackId: track.id, kind: track.kind})
    }
    trackRecorders[track.id].start(2000);
    // recorders[stream.id].onstop = () => createFileFormCurrentRecordedData(stream.id);
  } else {
    // todo see if need to remove track
  }
}

const removeTrack = (track) => {
  if (track.kind && trackRecorders?.[track.id]) {
    trackRecorders[track.id].stop();
    delete(trackRecorders[track.id]);
  }
}

async function createTrackFileFormCurrentRecordedData(id, type) {
  if (!trackRecordedData[id]) return;
  const blob = new Blob(trackRecordedData[id], { type: `${type}/webm` });
  const raw = await convertBlobToBase64(blob);
  chrome.runtime.sendMessage(extensionId, message = {action: 'uploadFile', message: raw, id}, callback = () => {
    delete(trackRecordedData[id]);
  });
}

const convertBlobToBase64 = blob => new Promise(resolve => {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = () => {
      const base64data = reader.result; 
      resolve(base64data);
  };
});

var inject = function() {
  function trace(method, id, args) {
    window.postMessage(['WebRTCExternals', method, JSON.stringify(args || {})], '*');
  }

  var id = 0;
  var origPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
  if (!origPeerConnection) {
    return; // can happen e.g. when peerconnection is disabled in Firefox.
  }

  window.RTCPeerConnection = function() {
    var pc = new origPeerConnection(arguments[0], arguments[1]);
    pc._id = id++;
  
    pc.addEventListener('addstream', function(e) {
      e.stream.addEventListener('removetrack', (event) => {
        removeTrack(event.track);
        trace('onstreamremovetrack', pc._id, event.track?.kind + ": " + event.track?.id);
      });
      trace('onaddstream', pc._id, e.stream.id + ' ' + e.stream.getTracks().map(function(t) { return t.kind + ':' + t.id; }));
    });
    pc.addEventListener('removestream', function(e) {
      trace('onremovestream', pc._id, e.stream.id + ' ' + e.stream.getTracks().map(function(t) { return t.kind + ':' + t.id; }));
    });
    pc.addEventListener('track', function(e) {
      // not need
      e.track.addEventListener('ended', (ev) => {
        trace('ontrackended', pc._id, e.track.kind + ": "+ e.track.muted + ": " + e.track.enabled + ':' + e.track.id);
      });
      // to pause the mediarecordor
      e.track.addEventListener('mute', (ev) => {
        trace('ontrackmuted', pc._id, e.track.kind + " muted: "+ e.track.muted + " enbled: " + e.track.enabled + ':' + e.track.id);
      });
      // to unpause the mediarecordor
      e.track.addEventListener('unmute', (ev) => {
        trace('ontrackunmuted', pc._id, e.track.kind + ": "+ e.track.muted + ": " + e.track.enabled + ':' + e.track.id);
      });
      addTrack(e.track);
      trace('ontrack', pc._id, e.track.kind + ": "+ e.track.muted + ": " + e.track.enabled + ':' + e.track.id + ' ' + e.streams.map(function(s) { return 'stream:' + s.id; }));
    });
    return pc;
  };

  window.RTCPeerConnection.prototype = origPeerConnection.prototype;
  window.webkitRTCPeerConnection.prototype = origPeerConnection.prototype;

  ['addStream', 'removeStream'].forEach(function(method) {
    var nativeMethod = window.RTCPeerConnection.prototype[method];
    if (nativeMethod) {
      window.RTCPeerConnection.prototype[method] = function() {
        var pc = this;
        var stream = arguments[0];
        var streamInfo = stream.getTracks().map(function(t) {
          return t.kind + ':' + t.id;
        });

        trace(method, pc._id, stream.id + ' ' + streamInfo);
        return nativeMethod.apply(pc, arguments);
      };
    }
  });

  ['addTrack'].forEach(function(method) {
    var nativeMethod = window.RTCPeerConnection.prototype[method];
    if (nativeMethod) {
      window.RTCPeerConnection.prototype[method] = function() {
        var pc = this;
        var track = arguments[0];
        var streams = [].slice.call(arguments, 1);
        trace(method, pc._id, track.kind + ':' + track.id + ' ' + (streams.map(function(s) { return 'stream:' + s.id; }).join(';') || '-'));
        var sender = nativeMethod.apply(pc, arguments);
        if (sender && sender.replaceTrack) {
          var nativeReplaceTrack = sender.replaceTrack;
          sender.replaceTrack = function(withTrack) {
            trace('replaceTrack', pc._id,
                (sender.track ? sender.track.kind + ':' + sender.track.id : 'null') +
                ' with ' +
                (withTrack ?  withTrack.kind + ':' + withTrack.id : 'null'));
            return nativeReplaceTrack.apply(sender, arguments);
          }
        }
        return sender;
      };
    }
  });

  ['removeTrack'].forEach(function(method) {
    var nativeMethod = window.RTCPeerConnection.prototype[method];
    if (nativeMethod) {
      window.RTCPeerConnection.prototype[method] = function() {
        var pc = this;
        var track = arguments[0].track;
        trace(method, pc._id, track ? track.kind + ':' + track.id : 'null');
        return nativeMethod.apply(pc, arguments);
      };
    }
  });

};
inject();
/**
  1. script injection
  2. show popup - 
      a. To start capturing
      b. show list of recorded stream and download option
      c. To Stop capturing
 */


window.addEventListener('message', function (event) {
  if (event.data[0] !== 'WebRTCExternals') return;
  // Make a simple request:
  chrome.runtime?.sendMessage(extensionId, message = {action: 'log', data: event.data});
});

