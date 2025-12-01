
'use client';
import { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import type { User, StoryItem } from '@/lib/mock-data';
import { useCollection, useFirestore, useUser, useMemoFirebase, useStorage } from '@/firebase';
import { collection, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Image as ImageIcon, Video, Camera, X, Check, Loader } from 'lucide-react';
import { Card } from './ui/card';
import { StoryViewer } from './story-viewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { CameraCapture } from './camera-capture';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '@/hooks/use-toast';

export function Stories() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user: loggedInUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  // For now, we'll fetch all users and filter client-side.
  // In a real app, you'd query for users with recent stories.
  const usersQuery = useMemoFirebase(
    () => (firestore && loggedInUser ? collection(firestore, 'users') : null),
    [firestore, loggedInUser]
  );
  const { data: allUsers, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  // Include current user if they have stories
  const allStoryUsers = useMemo(() => {
    const otherUsers = (allUsers || []).filter(u => u.id !== loggedInUser?.uid && u.stories && u.stories.length > 0);
    const currentUser = loggedInUser ? allUsers?.find(u => u.id === loggedInUser.uid) : null;
    const currentUserWithStories = currentUser && currentUser.stories && currentUser.stories.length > 0
      ? [currentUser]
      : [];
    return [...currentUserWithStories, ...otherUsers];
  }, [allUsers, loggedInUser]);

  const storyUsers = allStoryUsers || [];
  
  const handleStoryClick = (user: User) => {
    setCurrentUser(user);
    setIsViewerOpen(true);
  };
  
  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setCurrentUser(null);
  }

  const handleMediaCaptured = (dataUrl: string, type: 'image' | 'video') => {
    setMediaPreview(dataUrl);
    setMediaType(type);
    setShowPreview(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        return;
      }

      const url = URL.createObjectURL(file);
      setMediaPreview(url);
      setMediaType(isImage ? 'image' : 'video');
      setShowPreview(true);
    }
  };

  const handleRemoveMedia = () => {
    if (mediaPreview && mediaPreview.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsCameraOpen(open);
    if (!open) {
      // Only clear media when closing
      handleRemoveMedia();
      setShowPreview(false);
    }
  };

  const handleUploadStory = async () => {
    if (!mediaPreview || !mediaType || !loggedInUser || !firestore || !storage) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Missing required data to upload story.',
      });
      return;
    }

    setIsUploading(true);
    try {
      let blob: Blob;
      
      if (mediaPreview.startsWith('data:')) {
        // Data URL (from camera photo capture)
        const response = await fetch(mediaPreview);
        blob = await response.blob();
      } else if (mediaPreview.startsWith('blob:')) {
        // Blob URL (from camera video capture or file selection)
        const response = await fetch(mediaPreview);
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.statusText}`);
        }
        blob = await response.blob();
      } else {
        throw new Error('Invalid media preview URL');
      }

      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileExtension = mediaType === 'image' ? 'jpg' : 'webm';
      const fileName = `stories/${loggedInUser.uid}/${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Calculate duration for videos (default 5 seconds for images)
      const duration = mediaType === 'video' ? 15 : 5; // 15 seconds for videos, 5 for images

      // Create story object
      const newStory: StoryItem = {
        id: `story-${timestamp}`,
        type: mediaType,
        url: downloadURL,
        duration,
        viewed: false,
      };

      // Save to Firestore - add story to user's stories array
      const userDocRef = doc(firestore, 'users', loggedInUser.uid);
      await updateDoc(userDocRef, {
        stories: arrayUnion(newStory),
      });

      toast({
        title: 'Story Posted!',
        description: 'Your story has been shared with the community.',
      });

      // Close dialog and reset
      setIsCameraOpen(false);
      handleRemoveMedia();
      setShowPreview(false);
    } catch (error: any) {
      console.error('Error uploading story:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Could not upload story. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = () => {
    setShowPreview(false);
    setMediaPreview(null);
    setMediaType(null);
  };

  const isLoading = isUserLoading || areUsersLoading;

  return (
    <>
      <Card>
        <div className="p-4">
          <div className="flex items-center space-x-4">
            {/* Add Story */}
            <Dialog open={isCameraOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <button className="flex flex-col items-center space-y-1 cursor-pointer bg-transparent border-0 p-0">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                     {isLoading ? (
                        <Skeleton className="h-[60px] w-[60px] rounded-full" />
                     ) : (
                        <Avatar className="h-[60px] w-[60px] border-2 border-card">
                          <AvatarImage
                            src={loggedInUser?.photoURL || `https://picsum.photos/seed/${loggedInUser?.uid}/100/100`}
                            alt={loggedInUser?.displayName || 'You'}
                            data-ai-hint="woman portrait"
                          />
                          <AvatarFallback>
                            {loggedInUser?.displayName?.split(' ').map((n) => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                     )}
                    <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground">
                      <Plus className="h-3 w-3" />
                    </div>
                  </div>
                  <span className="w-16 truncate text-xs">Your Story</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Story</DialogTitle>
                </DialogHeader>
                {showPreview && mediaPreview ? (
                  // Preview Step (like Instagram/Facebook)
                  <div className="space-y-4">
                    <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden">
                      {mediaType === 'image' ? (
                        <Image
                          src={mediaPreview}
                          alt="Story preview"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <video
                          src={mediaPreview}
                          controls
                          className="w-full h-full object-contain"
                          autoPlay
                          loop
                        />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRetake}
                        variant="outline"
                        className="flex-1"
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Retake
                      </Button>
                      <Button
                        onClick={handleUploadStory}
                        className="flex-1"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Post Story
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Capture/Select Step
                  <Tabs defaultValue="camera" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="camera">
                        <Camera className="h-4 w-4 mr-2" />
                        Camera
                      </TabsTrigger>
                      <TabsTrigger value="gallery">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Gallery
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="camera" className="mt-4">
                      <CameraCapture onMediaCaptured={handleMediaCaptured} />
                    </TabsContent>
                    <TabsContent value="gallery" className="mt-4">
                      <div className="space-y-4">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="flex-1"
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Choose Image
                          </Button>
                          <Button
                            onClick={() => {
                              if (fileInputRef.current) {
                                fileInputRef.current.accept = 'video/*';
                                fileInputRef.current.click();
                              }
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Choose Video
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </DialogContent>
            </Dialog>

            {/* User Stories */}
            {isLoading && [...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-1">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                </div>
            ))}
            {!isLoading && storyUsers.map((user, index) => {
              const isCurrentUser = user.id === loggedInUser?.uid;
              return (
                <div
                  key={user.id}
                  className="flex flex-col items-center space-y-1 cursor-pointer"
                  onClick={() => handleStoryClick(user)}
                >
                  <div className={`relative rounded-full ${isCurrentUser ? 'bg-gradient-to-tr from-yellow-400 to-pink-600 p-0.5' : 'bg-gradient-to-tr from-yellow-400 to-pink-600 p-0.5'}`}>
                    <div className="rounded-full bg-card p-0.5">
                      <Avatar className="h-[60px] w-[60px]">
                        <AvatarImage
                          src={user.avatar}
                          alt={user.name}
                          data-ai-hint={
                            index % 2 === 0 ? 'man portrait' : 'woman portrait'
                          }
                        />
                        <AvatarFallback>
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <span className="w-16 truncate text-xs">{isCurrentUser ? 'Your Story' : user.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
      {isViewerOpen && currentUser && (
        <StoryViewer
          users={storyUsers}
          initialUser={currentUser}
          onClose={handleCloseViewer}
        />
      )}
    </>
  );
}
