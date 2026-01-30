"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, Calendar, MapPin, MessageSquare, Send, Star, UserX, Mail, Phone, MapPin as AddressIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import io, { Socket } from "socket.io-client"
import { API_BASE_URL } from "@/lib/config"

const API_BASE = `${API_BASE_URL}/api/admin/community-trip`
const SOCKET_URL = API_BASE_URL

interface CommunityTripViewProps {
  tripId: string
}

interface Message {
  _id: string
  userId: any
  userName: string
  userImage?: string
  message: string
  messageType: 'question' | 'answer' | 'general' | 'announcement'
  isAdminReply: boolean
  createdAt: string
  parentMessageId?: string
}

export default function CommunityTripView({ tripId }: CommunityTripViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [trip, setTrip] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [messageType, setMessageType] = useState<'question' | 'general'>('general')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false)
  const [memberToRemoveId, setMemberToRemoveId] = useState<string | null>(null)

  useEffect(() => {
    fetchTrip()
    fetchMessages()
    setupSocket()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [tripId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const setupSocket = () => {
    const token = localStorage.getItem('adminToken')
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Admin connected to socket')
      newSocket.emit('join-trip', tripId)
      newSocket.emit('join-admin-room') // Join admin room for notifications
    })

    newSocket.on('reconnect', () => {
      console.log('Socket reconnected')
      newSocket.emit('join-trip', tripId)
      newSocket.emit('join-admin-room')
      // Reload messages on reconnect
      fetchMessages()
    })

    newSocket.on('new-message', (message: Message) => {
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some(m => m._id === message._id);
        if (exists) {
          console.log('Duplicate message detected, ignoring:', message._id);
          return prev;
        }
        return [...prev, message];
      });
    })

    newSocket.on('message-updated', (message: Message) => {
      setMessages(prev => prev.map(m => m._id === message._id ? message : m))
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket')
    })

    setSocket(newSocket)
  }

  const fetchTrip = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE}/${tripId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (result.status) {
        setTrip(result.data)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch trip",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE}/${tripId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (result.status) {
        const fetchedMessages = result.data || [];
        // Remove duplicates based on _id and merge with existing
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m._id));
          const newMessages = fetchedMessages.filter((m: Message) => !existingIds.has(m._id));
          const combined = [...prev, ...newMessages];
          // Sort by createdAt and remove duplicates
          const sorted = combined.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateA.getTime() - dateB.getTime();
          });
          // Remove duplicates by _id
          const unique: Message[] = [];
          const seenIds = new Set<string>();
          for (const msg of sorted) {
            if (!seenIds.has(msg._id)) {
              seenIds.add(msg._id);
              unique.push(msg);
            }
          }
          return unique;
        });
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      toast({
        title: "Error",
        description: "Message cannot be empty",
        variant: "destructive",
      })
      return
    }

    if (!socket || !socket.connected) {
      toast({
        title: "Error",
        description: "Not connected to server. Please refresh the page.",
        variant: "destructive",
      })
      return
    }

    const messageText = newMessage.trim()
    setNewMessage("") // Clear input immediately

    // Set up error handler
    const errorHandler = (errorData: any) => {
      console.error('Message send error:', errorData)
      toast({
        title: "Error",
        description: errorData?.message || "Failed to send message",
        variant: "destructive",
      })
      setNewMessage(messageText) // Restore message on error
    }

    socket.once('error', errorHandler)

    try {
      const messageData = {
        tripId,
        message: messageText,
        messageType: 'general' // Admin messages are always general
      }

      socket.emit('send-message', messageData)
      
      // Remove error handler after delay
      setTimeout(() => {
        socket.off('error', errorHandler)
      }, 2000)
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      })
      setNewMessage(messageText) // Restore message on error
    }
  }

  const scrollToBottom = () => {
    document.getElementById('messages-end')?.scrollIntoView({ behavior: 'smooth' })
  }

  const getMemberCount = () => {
    if (!trip) return 0
    return trip.members?.filter((m: any) => m.status === 'approved').length || 0
  }

  const handleRemoveMember = async (userId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE}/${tripId}/member/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const result = await response.json()
      if (result.status) {
        toast({ title: "Success", description: "Member removed from trip" })
        setTrip(result.data)
        return true
      } else {
        toast({ title: "Error", description: result.message || "Failed to remove member", variant: "destructive" })
        return false
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to remove member", variant: "destructive" })
      return false
    }
  }

  const onConfirmRemoveMember = async () => {
    if (!memberToRemoveId) return
    const success = await handleRemoveMember(memberToRemoveId)
    if (success) {
      setRemoveMemberDialogOpen(false)
      setMemberToRemoveId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  const getQuestionMessages = () => {
    return messages.filter(m => m.messageType === 'question' && !m.parentMessageId)
  }

  const getAnswersForQuestion = (questionId: string) => {
    return messages.filter(m => m.parentMessageId === questionId)
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (!trip) {
    return <div className="p-6">Trip not found</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{trip.title}</h1>
          <p className="text-muted-foreground">{trip.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trip Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trip Images */}
          {trip.images && trip.images.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 gap-2">
                  {trip.images.slice(0, 4).map((img: any, idx: number) => (
                    <img
                      key={idx}
                      src={img.path}
                      alt={`Trip ${idx + 1}`}
                      className="w-full h-48 object-cover rounded"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trip Info */}
          <Card>
            <CardHeader>
              <CardTitle>Trip Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dates</p>
                    <p className="font-medium">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{trip.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Members</p>
                    <p className="font-medium">{getMemberCount()}/{trip.maxMembers}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trip Type</p>
                  <Badge>{trip.tripType}</Badge>
                </div>
                {(trip.averageRating > 0 || trip.totalRatings > 0) && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <div>
                      <p className="text-sm text-muted-foreground">Community Rating</p>
                      <p className="font-medium">
                        {trip.averageRating?.toFixed(1) || '0.0'} 
                        {trip.totalRatings > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({trip.totalRatings} {trip.totalRatings === 1 ? 'rating' : 'ratings'})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {trip.importantNotes && (
                <div>
                  <p className="text-sm font-medium mb-2">Important Notes</p>
                  <p className="text-sm text-muted-foreground">{trip.importantNotes}</p>
                </div>
              )}

              {trip.inclusions && trip.inclusions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Inclusions</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {trip.inclusions.map((inc: string, idx: number) => (
                      <li key={idx}>{inc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {trip.exclusions && trip.exclusions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Exclusions</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {trip.exclusions.map((exc: string, idx: number) => (
                      <li key={idx}>{exc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Group Chat Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Group Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages Container */}
              <div 
                className="h-[500px] overflow-y-auto p-4 bg-slate-50"
                style={{ scrollBehavior: 'smooth' }}
              >
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isAdmin = msg.isAdminReply
                      return (
                        <div
                          key={msg._id}
                          className={`flex gap-3 items-end ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <Avatar className="h-9 w-9 border-2 border-white shadow-md">
                              <AvatarImage src={msg.userImage} />
                              <AvatarFallback className={isAdmin ? 'bg-primary text-primary-foreground' : ''}>
                                {msg.userName[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {isAdmin && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white flex items-center justify-center">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Message Content */}
                          <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} max-w-[70%]`}>
                            {/* User Name & Time */}
                            <div className={`flex items-center gap-2 mb-1 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                              {!isAdmin && (
                                <span className="text-sm font-semibold text-slate-700">{msg.userName}</span>
                              )}
                              {isAdmin && (
                                <span className="text-sm font-semibold text-primary">You (Admin)</span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>

                            {/* Message Bubble */}
                            <div
                              className={`px-4 py-2.5 rounded-2xl ${
                                isAdmin
                                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                                  : 'bg-white text-slate-900 rounded-bl-sm border border-slate-200'
                              } shadow-sm`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {msg.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div id="messages-end" />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || !socket}
                    size="icon"
                    className="rounded-full"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {!socket && (
                  <p className="text-xs text-destructive mt-2">Not connected. Please refresh the page.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organizer Card */}
          <Card>
            <CardHeader>
              <CardTitle>Organizer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={trip.organizerImage?.path} />
                  <AvatarFallback>{trip.organizerName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{trip.organizerName}</p>
                    {trip.organizerVerified && (
                      <Badge variant="secondary" className="text-xs">Verified</Badge>
                    )}
                  </div>
                  {(trip.averageRating > 0 || trip.organizerRating > 0) && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{trip.averageRating || trip.organizerRating}</span>
                      {trip.totalRatings > 0 && (
                        <span className="text-xs text-muted-foreground">({trip.totalRatings} {trip.totalRatings === 1 ? 'rating' : 'ratings'})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members List - name, email, phone, address, profile picture + Remove */}
          <Card>
            <CardHeader>
              <CardTitle>Members ({getMemberCount()})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                <div className="space-y-4">
                  {trip.members?.filter((m: any) => m.status === 'approved').map((member: any, idx: number) => {
                    const user = member.userId;
                    const userId = user?._id || user?.id;
                    const userName = user?.name || user?.email || 'Member';
                    const userInitial = userName[0]?.toUpperCase() || 'M';
                    const profileImg = user?.profilePicture || user?.profileImage;
                    return (
                      <div key={userId || idx} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                        <Avatar className="h-14 w-14 shrink-0">
                          <AvatarImage src={profileImg} alt={userName} />
                          <AvatarFallback className="text-lg">{userInitial}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="font-semibold text-base">{userName}</p>
                          {user?.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span>{user.email}</span>
                            </div>
                          )}
                          {user?.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                          {user?.address && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <AddressIcon className="h-3.5 w-3.5 shrink-0" />
                              <span className="break-words">{user.address}</span>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground pt-1">
                            Joined {formatDate(member.joinedAt)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => userId && (setMemberToRemoveId(userId), setRemoveMemberDialogOpen(true))}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    );
                  })}
                  {(!trip.members?.length || getMemberCount() === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-6">No members joined yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={removeMemberDialogOpen} onOpenChange={(open) => {
        setRemoveMemberDialogOpen(open)
        if (!open) setMemberToRemoveId(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the trip?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

