'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '@/firebase';
import { 
  subscribeToNotifications, 
  subscribeToUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification 
} from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function NotificationsNav() {
  const { user } = useUser();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    // Subscribe to notifications
    const unsubscribeNotifications = subscribeToNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
    });

    // Subscribe to unread count
    const unsubscribeCount = subscribeToUnreadCount(user.uid, (count) => {
      setUnreadCount(count);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeCount();
    };
  }, [user?.uid]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
    
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    if (user?.uid) {
      await markAllNotificationsAsRead(user.uid);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👤';
      case 'message':
        return '📨';
      case 'post':
        return '📝';
      case 'system':
        return '🔔';
      default:
        return '🔔';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full min-h-[44px] min-w-[44px] touch-manipulation"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-7 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notifications.length > 0 ? (
            <div className="space-y-1 p-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer",
                    !notification.read && "bg-accent"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span className="text-lg mt-0.5" aria-hidden="true">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-semibold text-sm",
                      !notification.read && "font-bold"
                    )}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    {notification.createdAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
