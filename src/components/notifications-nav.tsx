import { Bell, UserPlus, ShoppingCart, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const notifications = [
    {
        id: 'n1',
        icon: UserPlus,
        title: 'New Connection Request',
        description: 'Priya Sharma wants to connect with you.',
        timestamp: '5m ago',
        for: 'doctor' // Simulate notification for a professional
    },
    {
        id: 'n2',
        icon: CheckCircle,
        title: 'Request Sent',
        description: 'Your request to connect with Dr. Ananya Gupta has been sent.',
        timestamp: '5m ago',
        for: 'user' // Simulate notification for the user
    },
    {
        id: 'n3',
        icon: ShoppingCart,
        title: 'Order Shipped!',
        description: 'Your order of Handmade Scented Candles has been shipped.',
        timestamp: '2h ago',
        for: 'user'
    }
]

export function NotificationsNav() {
  // In a real app, you'd filter notifications based on the logged-in user's role.
  // Here we'll just show all for demonstration.
  const userNotifications = notifications;
  const unreadCount = userNotifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {unreadCount}
                </span>
            )}
            <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userNotifications.length > 0 ? (
            userNotifications.map(notification => (
                 <DropdownMenuItem key={notification.id} className="flex items-start gap-3 p-3">
                    <notification.icon className="h-5 w-5 mt-1 text-primary" />
                    <div className="flex-1">
                        <p className="font-semibold text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
                    </div>
                </DropdownMenuItem>
            ))
        ) : (
             <p className="p-4 text-center text-sm text-muted-foreground">No new notifications</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
