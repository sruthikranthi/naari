'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Logo } from '@/components/logo';
import { Heart, Shield, Users, Sparkles, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface SplashScreenProps {
  onComplete: () => void;
}

const SPLASH_SKIP_KEY = 'sakhi_splash_skipped';

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [shouldShow, setShouldShow] = useState(true); // Always start with true to match SSR
  const [isMounted, setIsMounted] = useState(false);
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // Check localStorage only after component mounts (client-side only)
  useEffect(() => {
    // Defer state updates to avoid synchronous setState in effect
    const timer = setTimeout(() => {
      setIsMounted(true);
      if (typeof window !== 'undefined') {
        const hasSkipped = localStorage.getItem(SPLASH_SKIP_KEY) === 'true';
        if (hasSkipped) {
          setShouldShow(false);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Handle skip completion after initial render
  useEffect(() => {
    if (isMounted && !shouldShow) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        onComplete();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isMounted, shouldShow, onComplete]);

  useEffect(() => {
    if (!isMounted || !shouldShow) return;
    
    // Show splash for at least 2 seconds
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => {
        onComplete();
      }, 500); // Fade out delay
    }, 2500);

    return () => clearTimeout(timer);
  }, [isMounted, onComplete, shouldShow]);

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SPLASH_SKIP_KEY, 'true');
    }
    setIsAnimating(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  // If user is already logged in, skip splash
  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted || !shouldShow) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isAnimating ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-rose-950/20"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-20 w-64 h-64 bg-pink-200/30 dark:bg-pink-800/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 right-20 w-80 h-80 bg-purple-200/30 dark:bg-purple-800/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 w-72 h-72 bg-rose-200/30 dark:bg-rose-800/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 px-4">
        {/* Logo with animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center space-y-4"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
            className="relative"
          >
            <div className="absolute inset-0 bg-pink-400/20 dark:bg-pink-600/20 rounded-full blur-xl" />
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full p-6 shadow-2xl">
              <Heart className="w-16 h-16 text-pink-600 dark:text-pink-400" fill="currentColor" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Logo className="text-3xl md:text-4xl" />
          </motion.div>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center space-y-4 max-w-md"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 font-headline">
            Your Safe Space, Your Circle
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
            Empowering women through connection, support, and community
          </p>
        </motion.div>

        {/* Features icons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex items-center justify-center gap-8 flex-wrap"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex flex-col items-center space-y-2"
          >
            <div className="p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full">
              <Shield className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Safe</span>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex flex-col items-center space-y-2"
          >
            <div className="p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Community</span>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex flex-col items-center space-y-2"
          >
            <div className="p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full">
              <Sparkles className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Empowerment</span>
          </motion.div>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center space-x-2"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            className="w-2 h-2 bg-pink-500 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            className="w-2 h-2 bg-purple-500 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            className="w-2 h-2 bg-rose-500 rounded-full"
          />
        </motion.div>
      </div>

      {/* Skip button - motion.div wrapper to avoid button inside button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute top-4 right-4 z-20"
      >
        <Button
          variant="ghost"
          size="sm"
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          onClick={handleSkip}
        >
          <X className="h-4 w-4 mr-2" />
          Skip
        </Button>
      </motion.div>

      {/* Notification badge */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg">
          <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
            India&apos;s First Women-Only Social Platform
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

