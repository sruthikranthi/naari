
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { User, StoryItem } from '@/lib/mock-data';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';

interface StoryViewerProps {
  users: User[];
  initialUser: User;
  onClose: () => void;
}

export function StoryViewer({ users, initialUser, onClose }: StoryViewerProps) {
  const [currentUserIndex, setCurrentUserIndex] = useState(() =>
    users.findIndex((u) => u.id === initialUser.id)
  );
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const progressTimerRef = useRef<NodeJS.Timeout>();

  const currentUser = users[currentUserIndex];
  const currentStory = currentUser.stories?.[currentStoryIndex];

  const handleNextUser = useCallback(() => {
    if (currentUserIndex < users.length - 1) {
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  }, [currentUserIndex, users.length, onClose]);

  const handleNextStory = useCallback(() => {
    if (
      currentUser.stories &&
      currentStoryIndex < currentUser.stories.length - 1
    ) {
      setCurrentStoryIndex((prev) => prev + 1);
    } else {
      handleNextUser();
    }
  }, [currentUser, currentStoryIndex, handleNextUser]);

  useEffect(() => {
    if (!currentStory) return;

    const startTimers = () => {
      setProgress(0);

      progressTimerRef.current = setInterval(() => {
        setProgress((prev) => prev + 100 / (currentStory.duration * 10));
      }, 100);

      timerRef.current = setTimeout(() => {
        handleNextStory();
      }, currentStory.duration * 1000);
    };

    startTimers();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [currentStory, currentStoryIndex, currentUserIndex, handleNextStory]);

  const handlePrevUser = useCallback(() => {
    if (currentUserIndex > 0) {
      setCurrentUserIndex((prev) => prev - 1);
      const prevUser = users[currentUserIndex - 1];
      setCurrentStoryIndex((prevUser.stories?.length || 1) - 1);
    }
  }, [currentUserIndex, users]);

  const handlePrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
    } else {
      handlePrevUser();
    }
  }, [currentStoryIndex, handlePrevUser]);

  const handleNavigation = (e: React.MouseEvent<HTMLDivElement>) => {
    const clickX = e.clientX;
    const screenWidth = window.innerWidth;
    if (clickX < screenWidth / 3) {
      handlePrevStory();
    } else {
      handleNextStory();
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={handleNavigation}>
      <div className="relative h-full w-full max-w-md aspect-[9/16] flex flex-col overflow-hidden rounded-lg bg-secondary">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4">
          <div className="flex items-center gap-x-2">
            {currentUser.stories?.map((story, index) => (
              <div key={story.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ width: `${index === currentStoryIndex ? progress : index < currentStoryIndex ? 100 : 0}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
             <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={currentUser.avatar}
                    alt={currentUser.name}
                  />
                  <AvatarFallback>
                    {currentUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white font-semibold text-sm">{currentUser.name}</span>
          </div>
        </div>

        {/* Content */}
        {currentStory.type === 'image' && (
          <Image
            src={currentStory.url}
            alt="Story"
            fill
            className="object-cover"
            priority
          />
        )}
        {/* Add video support if needed */}

        {/* Close Button */}
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-4 right-4 z-20 text-white">
            <X size={28} />
        </button>

        {/* Navigation Buttons (invisible) */}
        <div
          className="absolute left-0 top-0 h-full w-1/3 z-10"
          onClick={(e) => { e.stopPropagation(); handlePrevStory(); }}
        />
        <div
          className="absolute right-0 top-0 h-full w-2/3 z-10"
          onClick={(e) => { e.stopPropagation(); handleNextStory(); }}
        />

        {/* User Navigation Arrows */}
         {currentUserIndex > 0 && (
            <button onClick={(e) => { e.stopPropagation(); handlePrevUser(); }} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white bg-black/30 rounded-full p-1">
                <ChevronLeft size={24} />
            </button>
         )}
         {currentUserIndex < users.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); handleNextUser(); }} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white bg-black/30 rounded-full p-1">
                <ChevronRight size={24} />
            </button>
         )}

      </div>
    </div>
  );
}
