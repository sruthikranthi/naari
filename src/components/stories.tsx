
'use client';
import { useState, useMemo, useRef } from 'react';
import type { User, StoryItem } from '@/lib/mock-data';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Image as ImageIcon, Video, Camera } from 'lucide-react';
import { Card } from './ui/card';
import { StoryViewer } from './story-viewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { CameraCapture } from './camera-capture';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// MOCK DATA INJECTION FOR DEMONSTRATION
const addMockStories = (users: User[]): User[] => {
  if (!users || users.length === 0) return [];
  return users.map((user, index) => {
    // Add stories to the first few users for demo purposes
    if (index === 0) {
      return {
        ...user,
        stories: [
          { id: 'story1', type: 'image', url: 'https://picsum.photos/seed/story1/1080/1920', duration: 5 },
          { id: 'story2', type: 'image', url: 'https://picsum.photos/seed/story2/1080/1920', duration: 5 },
        ]
      };
    }
    if (index === 1) {
      return {
        ...user,
        stories: [
          { id: 'story3', type: 'image', url: 'https://picsum.photos/seed/story3/1080/1920', duration: 5 },
        ]
      };
    }
    return user;
  });
};


export function Stories() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user: loggedInUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  // For now, we'll fetch all users and filter client-side.
  // In a real app, you'd query for users with recent stories.
  const usersQuery = useMemoFirebase(
    () => (firestore && loggedInUser ? collection(firestore, 'users') : null),
    [firestore, loggedInUser]
  );
  const { data: allUsers, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  const usersWithMockStories = useMemo(() => addMockStories(allUsers || []), [allUsers]);

  const storyUsers = usersWithMockStories.filter(u => u.id !== loggedInUser?.uid && u.stories && u.stories.length > 0) || [];
  
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
    // Here you would typically upload the media and update the user's stories
    // For now, just close the dialog
    setIsCameraOpen(false);
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
    }
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
                      {mediaPreview && (
                        <div className="relative">
                          {mediaType === 'image' ? (
                            <img
                              src={mediaPreview}
                              alt="Preview"
                              className="w-full h-auto rounded-lg max-h-96 object-contain"
                            />
                          ) : (
                            <video
                              src={mediaPreview}
                              controls
                              className="w-full h-auto rounded-lg max-h-96"
                            />
                          )}
                          <Button
                            onClick={handleRemoveMedia}
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            {/* User Stories */}
            {isLoading && [...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-1">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                </div>
            ))}
            {!isLoading && storyUsers.map((user, index) => (
              <div
                key={user.id}
                className="flex flex-col items-center space-y-1 cursor-pointer"
                onClick={() => handleStoryClick(user)}
              >
                <div className="relative rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 p-0.5">
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
                <span className="w-16 truncate text-xs">{user.name}</span>
              </div>
            ))}
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
