"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCircle2, XCircle, MapPin, User, Star, StarOff, Check, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import io, { Socket } from "socket.io-client"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ListSkeleton } from "@/components/ui/skeletons"

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
  isFavorite: boolean
  actionTaken?: 'approved' | 'rejected' | null
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

  const adminToken = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') || localStorage.getItem('token')) : null

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
      console.log('Socket connected for notifications page')
      newSocket.emit('join-admin-room')
    })

    newSocket.on('admin-notification', (notification: Notification) => {
      console.log('New notification received:', notification)
      setNotifications(prev => [notification, ...prev])
      
      toast({
        title: notification.title,
        description: notification.message,
      })
    })

    newSocket.on('join-request-approved', (data: { notificationId: string }) => {
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === data.notificationId 
            ? { ...notif, isRead: true, actionTaken: 'approved' }
            : notif
        )
      )
    })

    newSocket.on('join-request-rejected', (data: { notificationId: string }) => {
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === data.notificationId 
            ? { ...notif, isRead: true, actionTaken: 'rejected' }
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
  }, [adminToken, toast])

  // Fetch notifications
  useEffect(() => {
    fetchNotifications()
  }, [adminToken])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      // Remove trailing slash and ensure single /api
      const baseUrl = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '')
      const response = await fetch(`${baseUrl}/api/admin/notifications`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })
      const result = await response.json()

      if (result.status) {
        setNotifications(result.data || [])
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      })
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
        toast({
          title: "Success",
          description: "Notification marked as read",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to mark as read")
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark notification as read",
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
        toast({
          title: "Success",
          description: "All notifications marked as read",
        })
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      })
    }
  }

  const handleToggleFavorite = async (notificationId: string) => {
    try {
      const baseUrl = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '')
      const response = await fetch(`${baseUrl}/api/admin/notifications/${notificationId}/favorite`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const result = await response.json()

      if (result.status) {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId
              ? { ...notif, isFavorite: result.data.isFavorite }
              : notif
          )
        )
        toast({
          title: "Success",
          description: result.data.isFavorite ? "Added to favorites" : "Removed from favorites",
        })
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      })
    }
  }

  const handleApprove = async (notification: Notification) => {
    try {
      const baseUrl = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '')
      
      // Check if it's a trip creation request or join request
      if (notification.type === 'community_trip_creation_request' && notification.tripId) {
        // Approve trip creation
        const tripId = typeof notification.tripId === 'string' ? notification.tripId : notification.tripId._id
        const response = await fetch(`${baseUrl}/api/admin/community-trip/${tripId}/approve`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        })

        const result = await response.json()

        if (result.status) {
          toast({
            title: "Success",
            description: "Community trip approved successfully",
          })
          setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true, actionTaken: 'approved' } : n))
          fetchNotifications()
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to approve trip",
            variant: "destructive",
          })
        }
      } else {
        // Approve join request
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
          setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true, actionTaken: 'approved' } : n))
          fetchNotifications()
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to approve request",
            variant: "destructive",
          })
        }
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
      
      // Check if it's a trip creation request or join request
      if (notification.type === 'community_trip_creation_request' && notification.tripId) {
        // Reject trip creation
        const tripId = typeof notification.tripId === 'string' ? notification.tripId : notification.tripId._id
        const response = await fetch(`${baseUrl}/api/admin/community-trip/${tripId}/reject`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        })

        const result = await response.json()

        if (result.status) {
          toast({
            title: "Success",
            description: "Community trip rejected successfully",
          })
          setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true, actionTaken: 'rejected' } : n))
          fetchNotifications()
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to reject trip",
            variant: "destructive",
          })
        }
      } else {
        // Reject join request
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
          setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true, actionTaken: 'rejected' } : n))
          fetchNotifications()
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to reject request",
            variant: "destructive",
          })
        }
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

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "Recently"
    }
  }

  // Helper function to mark notification as read (without toast)
  const markNotificationAsRead = async (notificationId: string) => {
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
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Auto-mark notifications as read when viewing in "all" tab
  useEffect(() => {
    if (activeTab === "all" && notifications.length > 0 && adminToken) {
      const unreadNotifications = notifications.filter(n => !n.isRead)
      if (unreadNotifications.length > 0) {
        // Mark all unread notifications as read after a short delay (when user views them)
        const timer = setTimeout(() => {
          unreadNotifications.forEach(notif => {
            markNotificationAsRead(notif._id)
          })
        }, 2000) // 2 second delay to ensure user has seen them

        return () => clearTimeout(timer)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]) // Only depend on activeTab to avoid infinite loop

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === "unread") {
      return !notif.isRead
    }
    if (activeTab === "favorites") {
      return notif.isFavorite
    }
    return true // "all"
  })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const favoriteCount = notifications.filter(n => n.isFavorite).length

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all your notifications
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                All
                {notifications.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {notifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex items-center gap-2">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Favorites
                {favoriteCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {favoriteCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <CardContent className="p-0">
                {loading ? (
                  <ListSkeleton items={8} />
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {activeTab === "unread" 
                      ? "No unread notifications" 
                      : activeTab === "favorites"
                      ? "No favorite notifications"
                      : "No notifications"}
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <div className="divide-y">
                      {filteredNotifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-6 hover:bg-muted/50 transition-colors ${
                            !notification.isRead ? 'bg-muted/30' : ''
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="mt-1">
                              {notification.type === 'community_trip_join_request' || notification.type === 'community_trip_creation_request' ? (
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User className="h-5 w-5 text-blue-600" />
                                </div>
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                  <Bell className="h-5 w-5 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-base font-semibold">{notification.title}</h3>
                                    {!notification.isRead && (
                                      <Badge variant="default" className="text-xs">New</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {notification.message}
                                  </p>
                                  {notification.tripId && (
                                    <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                                      <MapPin className="h-4 w-4" />
                                      <span className="font-medium">{notification.tripId.title}</span>
                                      <span>•</span>
                                      <span>{notification.tripId.location}</span>
                                    </div>
                                  )}
                                  {notification.requestUserId && (
                                    <div className="flex items-center gap-2 mb-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={notification.requestUserId.profileImage} />
                                        <AvatarFallback>
                                          {notification.requestUserId.name?.charAt(0) || notification.requestUserId.email?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm font-medium">
                                        {notification.requestUserId.name || notification.requestUserId.email}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatTime(notification.createdAt)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleToggleFavorite(notification._id)}
                                    className="h-8 w-8"
                                  >
                                    {notification.isFavorite ? (
                                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    ) : (
                                      <StarOff className="h-4 w-4" />
                                    )}
                                  </Button>
                                  {!notification.isRead && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(notification._id)}
                                      className="text-xs"
                                    >
                                      Mark as read
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {(notification.type === 'community_trip_join_request' || notification.type === 'community_trip_creation_request') && !notification.actionTaken && (
                                <div className="flex items-center gap-2 mt-4">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApprove(notification)}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReject(notification)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  )
}

