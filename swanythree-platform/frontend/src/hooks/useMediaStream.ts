/**
 * SwanyThree Media Stream Hook — getUserMedia with track toggling.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseMediaStreamOptions {
  video?: boolean;
  audio?: boolean;
}

export function useMediaStream(options: UseMediaStreamOptions = { video: true, audio: true }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasVideo, setHasVideo] = useState(options.video ?? true);
  const [hasAudio, setHasAudio] = useState(options.audio ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startStream = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: options.video
          ? {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
              echoCancellation: true,
            }
          : false,
        audio: options.audio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 44100,
            }
          : false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasVideo(mediaStream.getVideoTracks().length > 0);
      setHasAudio(mediaStream.getAudioTracks().length > 0);
    } catch (err) {
      const message =
        err instanceof DOMException
          ? err.name === 'NotAllowedError'
            ? 'Camera/microphone permission denied. Please allow access in your browser settings.'
            : err.name === 'NotFoundError'
              ? 'No camera or microphone found.'
              : `Media error: ${err.message}`
          : 'Failed to access media devices.';
      setError(message);
    } finally {
      setIsInitializing(false);
    }
  }, [options.video, options.audio]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setHasVideo(videoTracks[0]?.enabled ?? false);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setHasAudio(audioTracks[0]?.enabled ?? false);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    stream,
    hasVideo,
    hasAudio,
    error,
    isInitializing,
    startStream,
    stopStream,
    toggleVideo,
    toggleAudio,
  };
}
