
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
        video: {
          facingMode: 'user', // Use front camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: isAudioEnabled,
      });
      setStream(newStream);
      setHasCameraPermission(true);
      
      // Set the stream to video element and ensure it plays
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        
        // Ensure video plays immediately
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.error('Error playing video:', err);
          });
        }
        
        // Also handle when metadata is loaded
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch((err) => {
              console.error('Error playing video after metadata loaded:', err);
            });
          }
        };
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
      // Clean up stream when component unmounts or dependencies change
      const currentStream = stream;
      const currentVideoRef = videoRef.current;
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      // Also clear video srcObject
      if (currentVideoRef) {
        currentVideoRef.srcObject = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAudioEnabled]);

  // Ensure video plays when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error('Error playing video stream:', err);
        });
      }
    }
  }, [stream]);

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
      <div className="relative flex-1 min-h-[400px] bg-black rounded-md overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted={!isAudioEnabled}
          playsInline
          style={{ transform: 'scaleX(-1)' }} // Mirror the video for better UX
          onLoadedMetadata={(e) => {
            // Ensure video plays when metadata is loaded
            const video = e.currentTarget;
            video.play().catch((err) => {
              console.error('Error playing video on metadata load:', err);
            });
          }}
          onCanPlay={(e) => {
            // Ensure video plays when it can play
            const video = e.currentTarget;
            if (video.paused) {
              video.play().catch((err) => {
                console.error('Error playing video on canplay:', err);
              });
            }
          }}
        />
        {!stream && hasCameraPermission && (
          <div className="absolute inset-0 flex items-center justify-center bg-black text-white z-10">
            <p>Starting camera...</p>
          </div>
        )}
        {stream && videoRef.current && videoRef.current.readyState < 2 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-10">
            <p>Loading camera feed...</p>
          </div>
        )}
        {isRecording && (
          <div className="absolute top-2 left-2 flex items-center gap-2 rounded-full bg-destructive px-3 py-1 text-white text-sm z-10">
            <Circle className="h-2 w-2 fill-current animate-pulse" />
            REC
          </div>
        )}
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
