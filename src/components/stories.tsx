
'use client';
import { useState } from 'react';
import type { User, StoryItem } from '@/lib/mock-data';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { Card } from './ui/card';
import { StoryViewer } from './story-viewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { CameraCapture } from './camera-capture';
import { Skeleton } from './ui/skeleton';

export function Stories() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const { user: loggedInUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  // For now, we'll fetch all users and filter client-side.
  // In a real app, you'd query for users with recent stories.
  const usersQuery = useMemoFirebase(
    () => (firestore && loggedInUser ? collection(firestore, 'users') : null),
    [firestore, loggedInUser]
  );
  const { data: allUsers, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  const storyUsers = allUsers?.filter(u => u.id !== loggedInUser?.uid && u.stories && u.stories.length > 0) || [];
  
  const handleStoryClick = (user: User) => {
    setCurrentUser(user);
    setIsViewerOpen(true);
  };
  
  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setCurrentUser(null);
  }

  const handleMediaCaptured = (dataUrl: string, type: 'image' | 'video') => {
    console.log('New story captured:', { type, dataUrl });
    // Here you would typically upload the media and update the user's stories
    setIsCameraOpen(false);
  };

  const isLoading = isUserLoading || areUsersLoading;

  return (
    <>
      <Card>
        <div className="p-4">
          <div className="flex items-center space-x-4">
            {/* Add Story */}
            <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
              <DialogTrigger asChild>
                <div className="flex flex-col items-center space-y-1 cursor-pointer">
                  <button className="relative flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
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
                  </button>
                  <span className="w-16 truncate text-xs">Your Story</span>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Story</DialogTitle>
                    </DialogHeader>
                    <CameraCapture onMediaCaptured={handleMediaCaptured} />
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
