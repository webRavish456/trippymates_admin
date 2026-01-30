"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/lib/config"
import io, { Socket } from "socket.io-client"
import { useToast } from "@/hooks/use-toast"

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
      setNotifications(prev => {
        const updated = prev.map(notif => 
          notif._id === data.notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
        setUnreadCount(updated.filter(n => !n.isRead).length)
        return updated
      })
    })

    newSocket.on('join-request-rejected', (data: { notificationId: string }) => {
      setNotifications(prev => {
        const updated = prev.map(notif => 
          notif._id === data.notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
        setUnreadCount(updated.filter(n => !n.isRead).length)
        return updated
      })
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

  const handleBellClick = async () => {
    if (unreadCount > 0 && adminToken) {
      try {
        const baseUrl = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '')
        await fetch(`${baseUrl}/api/admin/notifications/read-all`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        })
        setUnreadCount(0)
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      } catch (e) {
        console.error("Error marking notifications as read:", e)
      }
    }
    router.push('/admin/notifications')
  }

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={handleBellClick}
      >
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
      
    </div>
  )
}

