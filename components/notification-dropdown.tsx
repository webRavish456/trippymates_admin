"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, Check, X, Clock, MapPin, User, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import io, { Socket } from "socket.io-client"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  tripId?: {
    _id: string
    title: string
    location: string
  }
  requestUserId?: {
    _id: string
    name: string
    email: string
    profileImage?: string
  }
  isRead: boolean
  isFavorite?: boolean
  createdAt: string
}

interface NotificationDropdownProps {
  adminToken: string | null
  adminId?: string
}

export function NotificationDropdown({ adminToken, adminId }: NotificationDropdownProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  // Setup Socket.IO connection
  useEffect(() => {
    if (!adminToken) return

    const newSocket = io(API_BASE_URL, {
      auth: {
        token: adminToken
      },
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Socket connected for notifications')
      // Join admin room - adminId will be extracted from token in backend
      newSocket.emit('join-admin-room')
    })

    newSocket.on('admin-notification', (notification: Notification) => {
      console.log('New notification received:', notification)
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
      
      toast({
        title: notification.title,
        description: notification.message,
      })
    })

    newSocket.on('join-request-approved', (data: { notificationId: string }) => {
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === data.notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      )
    })

    newSocket.on('join-request-rejected', (data: { notificationId: string }) => {
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === data.notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      )
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [adminToken, adminId, toast])

  // Fetch notifications
  useEffect(() => {
    fetchNotifications()
  }, [adminToken])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const baseUrl = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '')
      const response = await fetch(`${baseUrl}/api/admin/notifications`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })
      const result = await response.json()

      if (result.status) {
        setNotifications(result.data || [])
        setUnreadCount(result.unreadCount || 0)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const baseUrl = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '')
      const response = await fetch(`${baseUrl}/api/admin/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId
              ? { ...notif, isRead: true }
              : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleApprove = async (notification: Notification) => {
    try {
      const baseUrl = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '')
      const response = await fetch(`${baseUrl}/api/admin/notifications/${notification._id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Join request approved successfully",
        })
        handleMarkAsRead(notification._id)
        fetchNotifications()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to approve request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error approving request:", error)
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (notification: Notification) => {
    try {
      const baseUrl = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '')
      const response = await fetch(`${baseUrl}/api/admin/notifications/${notification._id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const result = await response.json()

      if (result.status) {
        toast({
          title: "Success",
          description: "Join request rejected successfully",
        })
        handleMarkAsRead(notification._id)
        fetchNotifications()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to reject request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const baseUrl = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '')
      const response = await fetch(`${baseUrl}/api/admin/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, isRead: true }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "Recently"
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false)
                router.push('/admin/notifications')
              }}
              className="text-xs"
            >
              View All
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? 'bg-muted/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {notification.type === 'community_trip_join_request' ? (
                        <User className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          {notification.tripId && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{notification.tripId.title} - {notification.tripId.location}</span>
                            </div>
                          )}
                          {notification.requestUserId && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{notification.requestUserId.name || notification.requestUserId.email}</span>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      {notification.type === 'community_trip_join_request' && !notification.isRead && (
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(notification)}
                            className="h-7 text-xs"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(notification)}
                            className="h-7 text-xs"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

