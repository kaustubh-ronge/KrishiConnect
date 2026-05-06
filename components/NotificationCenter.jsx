"use client";

import { useState, useEffect } from "react";
import { Bell, X, Check, CheckCheck, Trash2, Package, Star, AlertCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearAllNotifications } from "@/actions/notifications";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";

const notificationIcons = {
  ORDER_RECEIVED: Package,
  ORDER_STATUS_UPDATE: Package,
  ORDER_SHIPPED: Package,
  ORDER_DELIVERED: Package,
  PAYOUT_PROCESSED: DollarSign,
  REVIEW_RECEIVED: Star,
  DISPUTE_OPENED: AlertCircle,
  DISPUTE_RESOLVED: CheckCheck,
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    const res = await getUserNotifications();
    if (res.success) {
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    const res = await markNotificationAsRead(id);
    if (res.success) {
      loadNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    const res = await markAllNotificationsAsRead();
    if (res.success) {
      toast.success("All notifications marked as read");
      loadNotifications();
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteNotification(id);
    if (res.success) {
      loadNotifications();
    }
  };

  const handleClearAll = async () => {
    const res = await clearAllNotifications();
    if (res.success) {
      toast.success("All notifications cleared");
      loadNotifications();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 hover:bg-red-600 border-2 border-white"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg">Notifications</h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleMarkAllAsRead}
                className="text-xs h-7"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleClearAll}
                className="text-xs h-7 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Bell className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 font-medium">No notifications</p>
              <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              <AnimatePresence>
                {notifications.map((notification, index) => {
                  const Icon = notificationIcons[notification.type] || Bell;
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <NotificationItem
                        notification={notification}
                        Icon={Icon}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                        setOpen={setOpen}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({ notification, Icon, onMarkAsRead, onDelete, setOpen }) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.linkUrl) {
      setOpen(false);
    }
  };

  const content = (
    <div
      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${
        !notification.isRead ? 'bg-blue-50/50' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${!notification.isRead ? 'bg-blue-100' : 'bg-gray-100'}`}>
          <Icon className={`h-4 w-4 ${!notification.isRead ? 'text-blue-600' : 'text-gray-600'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
            </p>
            {!notification.isRead && (
              <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5"></div>
            )}
          </div>
          
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>
          
          <p className="text-xs text-gray-400 mt-2">
            {formatTimestamp(notification.createdAt)}
          </p>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  if (notification.linkUrl) {
    return <Link href={notification.linkUrl}>{content}</Link>;
  }

  return content;
}

function formatTimestamp(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString('en-IN', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

