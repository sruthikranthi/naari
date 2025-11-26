
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Video, Mic, MicOff, Circle, Square } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface CameraCaptureProps {
  onMediaCaptured: (dataUrl: string, type: 'image' | 'video') => void;
  showControls?: boolean;
}

export function CameraCapture({ onMediaCaptured, showControls = true }: CameraCaptureProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const getCameraPermission = useCallback(async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: isAudioEnabled,
      });
      setStream(newStream);
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this feature.',
      });
    }
  }, [isAudioEnabled, toast]);

  useEffect(() => {
    getCameraPermission();
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAudioEnabled]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onMediaCaptured(dataUrl, 'image');
      }
    }
  };

  const startRecording = () => {
    if (stream) {
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        onMediaCaptured(videoUrl, 'video');
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };
  
  if (hasCameraPermission === false) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Camera Access Required</AlertTitle>
        <AlertDescription>
          Please allow camera access in your browser settings and refresh the page to use this feature.
        </AlertDescription>
      </Alert>
    );
  }

  if(hasCameraPermission === null) {
      return (
          <div className="flex h-64 items-center justify-center">
              <p>Requesting camera permission...</p>
          </div>
      )
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="relative flex-1">
        <video
          ref={videoRef}
          className="w-full h-full aspect-video rounded-md bg-secondary object-cover"
          autoPlay
          muted={!isAudioEnabled}
          playsInline
        />
        {isRecording && <div className="absolute top-2 left-2 flex items-center gap-2 rounded-full bg-destructive px-3 py-1 text-white text-sm"><Circle className="h-2 w-2 fill-current" />REC</div>}
      </div>
      {showControls && (
        <div className="flex justify-center gap-4">
          <Button onClick={toggleAudio} variant="outline" size="icon">
            {isAudioEnabled ? <Mic /> : <MicOff />}
            <span className="sr-only">Toggle Audio</span>
          </Button>
          {!isRecording && (
            <Button onClick={takePhoto} variant="outline" size="icon" className="h-12 w-12 rounded-full">
              <Camera />
              <span className="sr-only">Take Photo</span>
            </Button>
          )}
          {isRecording ? (
            <Button onClick={stopRecording} variant="destructive" size="icon" className="h-12 w-12 rounded-full">
              <Square />
              <span className="sr-only">Stop Recording</span>
            </Button>
          ) : (
            <Button onClick={startRecording} variant="destructive" size="icon" className="h-12 w-12 rounded-full">
              <Video />
              <span className="sr-only">Start Recording</span>
            </Button>
          )}
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
