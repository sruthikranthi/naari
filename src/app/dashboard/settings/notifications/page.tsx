'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { 
  getNotificationPreferences, 
  updateNotificationPreferences,
  type NotificationPreferences 
} from '@/lib/notifications';
import { 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications,
  isSubscribedToPushNotifications,
  savePushSubscription,
  removePushSubscription
} from '@/lib/push-notifications';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff } from 'lucide-react';

export default function NotificationSettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const loadPreferences = async () => {
      try {
        const prefs = await getNotificationPreferences(user.uid);
        setPreferences(prefs);
        
        const subscribed = await isSubscribedToPushNotifications();
        setIsPushSubscribed(subscribed);
      } catch (error) {
        console.error('Error loading preferences:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load notification preferences',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user?.uid, toast]);

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: any) => {
    if (!user?.uid || !preferences) return;

    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    
    try {
      await updateNotificationPreferences(user.uid, { [key]: value });
      toast({
        title: 'Preferences Updated',
        description: 'Your notification preferences have been saved.',
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update preferences',
      });
      // Revert on error
      setPreferences(preferences);
    }
  };

  const handleTypePreferenceChange = async (type: keyof NotificationPreferences['types'], value: boolean) => {
    if (!user?.uid || !preferences) return;

    const updated = {
      ...preferences,
      types: { ...preferences.types, [type]: value },
    };
    setPreferences(updated);
    
    try {
      await updateNotificationPreferences(user.uid, {
        types: { [type]: value },
      });
    } catch (error) {
      console.error('Error updating type preference:', error);
      setPreferences(preferences);
    }
  };

  const handlePushSubscription = async () => {
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      if (isPushSubscribed) {
        // Unsubscribe
        await unsubscribeFromPushNotifications();
        setIsPushSubscribed(false);
        toast({
          title: 'Push Notifications Disabled',
          description: 'You will no longer receive push notifications',
        });
      } else {
        // Subscribe
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          toast({
            variant: 'destructive',
            title: 'Configuration Error',
            description: 'Push notifications are not configured',
          });
          return;
        }

        const subscription = await subscribeToPushNotifications(vapidPublicKey);
        if (subscription) {
          await savePushSubscription(user.uid, subscription);
          setIsPushSubscribed(true);
          toast({
            title: 'Push Notifications Enabled',
            description: 'You will now receive push notifications',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Permission Denied',
            description: 'Please allow notifications in your browser settings',
          });
        }
      }
    } catch (error) {
      console.error('Error toggling push subscription:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update push notification settings',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !preferences) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage how you receive notifications
        </p>
      </div>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Receive notifications even when the app is closed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Enable Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about important updates
              </p>
            </div>
            <Button
              variant={isPushSubscribed ? 'default' : 'outline'}
              onClick={handlePushSubscription}
              disabled={isSaving}
              className="gap-2"
            >
              {isPushSubscribed ? (
                <>
                  <Bell className="h-4 w-4" />
                  Enabled
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4" />
                  Enable
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="in-app">In-App Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show notifications within the app
              </p>
            </div>
            <Switch
              id="in-app"
              checked={preferences.inApp}
              onCheckedChange={(checked) => handlePreferenceChange('inApp', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email"
              checked={preferences.email}
              onCheckedChange={(checked) => handlePreferenceChange('email', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Browser push notifications
              </p>
            </div>
            <Switch
              id="push"
              checked={preferences.push}
              onCheckedChange={(checked) => handlePreferenceChange('push', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(preferences.types).map(([type, enabled]) => (
            <div key={type} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={type} className="capitalize">
                  {type === 'likes' ? 'Likes' :
                   type === 'comments' ? 'Comments' :
                   type === 'follows' ? 'New Followers' :
                   type === 'messages' ? 'Messages' :
                   type === 'posts' ? 'New Posts' :
                   type === 'system' ? 'System Updates' : type}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {type === 'likes' ? 'When someone likes your post' :
                   type === 'comments' ? 'When someone comments on your post' :
                   type === 'follows' ? 'When someone follows you' :
                   type === 'messages' ? 'When you receive a message' :
                   type === 'posts' ? 'Updates about posts you follow' :
                   type === 'system' ? 'Important system announcements' : ''}
                </p>
              </div>
              <Switch
                id={type}
                checked={enabled}
                onCheckedChange={(checked) => handleTypePreferenceChange(type as keyof NotificationPreferences['types'], checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

