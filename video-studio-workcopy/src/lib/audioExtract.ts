type CaptureVideoElement = HTMLVideoElement & {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
};

function waitForEvent(target: EventTarget, eventName: string) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      target.removeEventListener(eventName, onSuccess);
      target.removeEventListener('error', onError);
    };
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`Failed while waiting for ${eventName}.`));
    };

    target.addEventListener(eventName, onSuccess, { once: true });
    target.addEventListener('error', onError, { once: true });
  });
}

function pickAudioMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || '';
}

export async function extractAudioFromVideo(file: File, durationSeconds: number) {
  if (!('MediaRecorder' in window)) {
    throw new Error('Browser ini belum support MediaRecorder audio extraction.');
  }

  const video = document.createElement('video') as CaptureVideoElement;
  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.style.position = 'fixed';
  video.style.pointerEvents = 'none';
  video.style.opacity = '0';
  video.style.width = '1px';
  video.style.height = '1px';
  document.body.appendChild(video);

  try {
    await waitForEvent(video, 'loadedmetadata');
    const captureStream = video.captureStream || video.mozCaptureStream;
    if (!captureStream) {
      throw new Error('Browser ini belum support captureStream untuk ekstrak audio.');
    }

    const stream = captureStream.call(video);
    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) {
      throw new Error('Audio track tidak ditemukan di video ini.');
    }

    const audioStream = new MediaStream(audioTracks);
    const mimeType = pickAudioMimeType();
    const recorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];

    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    });

    const stopped = waitForEvent(recorder, 'stop');
    recorder.start(1000);
    await video.play();

    const maxDuration = Math.min(durationSeconds || video.duration || 120, video.duration || 120);
    await new Promise((resolve) => {
      const startedAt = performance.now();
      const timer = window.setInterval(() => {
        const elapsed = (performance.now() - startedAt) / 1000;
        if (video.ended || video.currentTime >= maxDuration || elapsed >= maxDuration + 1) {
          window.clearInterval(timer);
          resolve(undefined);
        }
      }, 250);
    });

    if (recorder.state !== 'inactive') recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    audioStream.getTracks().forEach((track) => track.stop());

    const type = recorder.mimeType || mimeType || 'audio/webm';
    return new File(chunks, file.name.replace(/\.[^.]+$/, '.webm'), { type });
  } finally {
    video.pause();
    URL.revokeObjectURL(objectUrl);
    video.remove();
  }
}
