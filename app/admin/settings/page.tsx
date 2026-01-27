"use client"

import { useState, useEffect } from "react"
import { Save, Mail, CreditCard, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { useSelector } from "react-redux"
import { RootState } from "@/components/redux/store"
import { API_BASE_URL } from "@/lib/config"
type SettingsPermission = {
  create: boolean;
  update: boolean;

}
type Permission = {
  module: string;
  create: boolean;
  update: boolean;
}
export default function SettingsPage() {

  const permissions = useSelector(
    (state: RootState) => state.permission.permissions
  )
  const [hasPermission, setHasPermission] = useState<SettingsPermission>({
    create: false,
    update: false,
  })
 
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [showRazorpayKey, setShowRazorpayKey] = useState(false)
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false)

  // Email Settings State
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "",
    enabled: true,
  })

  // Razorpay Settings State
  const [razorpaySettings, setRazorpaySettings] = useState({
    keyId: "",
    keySecret: "",
    enabled: true,
  })

  // Fetch settings on component mount
  useEffect(() => {
    fetchEmailSettings()
    fetchRazorpaySettings()
  }, [])

  useEffect(() => {
    const settingsPermission = permissions.find(
      (p: Permission) => p.module === "settings"
    )
    setHasPermission({
      create: settingsPermission?.create ?? false,
      update: settingsPermission?.update ?? false,
    })
  }, [])    

  const fetchEmailSettings = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/email`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.status && data.data) {
        setEmailSettings(data.data)
      }
    } catch (error) {
      console.error("Error fetching email settings:", error)
    }
  }

  const fetchRazorpaySettings = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/razorpay`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.status && data.data) {
        setRazorpaySettings(data.data)
      }
    } catch (error) {
      console.error("Error fetching Razorpay settings:", error)
    }
  }

  const handleSaveEmailSettings = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(emailSettings)
      })
      
      const data = await response.json()
      
      if (data.status) {
        toast({
          title: "Success",
          description: "Email settings saved successfully",
        })
        // Refresh settings after save
        await fetchEmailSettings()
      } else {
        throw new Error(data.message || "Failed to save email settings")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save email settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveRazorpaySettings = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/razorpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(razorpaySettings)
      })
      
      const data = await response.json()
      
      if (data.status) {
        toast({
          title: "Success",
          description: "Razorpay settings saved successfully",
        })
        // Refresh settings after save
        await fetchRazorpaySettings()
      } else {
        throw new Error(data.message || "Failed to save Razorpay settings")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save Razorpay settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings and configurations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 items-start">
        {/* Email Settings Card */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Email Settings</CardTitle>
                <CardDescription>Configure SMTP settings for email notifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  value={emailSettings.smtpHost}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  value={emailSettings.smtpPort}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                  placeholder="587"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                value={emailSettings.smtpUser}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                placeholder="your-email@gmail.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={emailSettings.smtpPassword}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                placeholder="••••••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                value={emailSettings.fromEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                placeholder="noreply@trippymates.com"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="emailEnabled">Enable Email Settings</Label>
                <p className="text-xs text-muted-foreground">Enable email notifications</p>
              </div>
              <Switch
                id="emailEnabled"
                checked={emailSettings.enabled}
                onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, enabled: checked })}
              />
            </div>
          </CardContent>
          
          {/* Save Email Settings Button */}
          <div className="px-6 pb-6">
           {(hasPermission.update || hasPermission.create) && <Button 
              onClick={handleSaveEmailSettings} 
              disabled={isSaving}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Email Settings
            </Button>}
          </div>
        </Card>

        {/* Razorpay Settings Card */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Razorpay Settings</CardTitle>
                <CardDescription>Configure Razorpay payment gateway credentials</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label htmlFor="keyId">Razorpay Key ID</Label>
              <div className="relative">
                <Input
                  id="keyId"
                  type={showRazorpayKey ? "text" : "password"}
                  value={razorpaySettings.keyId}
                  onChange={(e) => setRazorpaySettings({ ...razorpaySettings, keyId: e.target.value })}
                  placeholder="rzp_live_xxxxxxxxxxxxx"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowRazorpayKey(!showRazorpayKey)}
                >
                  {showRazorpayKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keySecret">Razorpay Key Secret</Label>
              <div className="relative">
                <Input
                  id="keySecret"
                  type={showRazorpaySecret ? "text" : "password"}
                  value={razorpaySettings.keySecret}
                  onChange={(e) => setRazorpaySettings({ ...razorpaySettings, keySecret: e.target.value })}
                  placeholder="••••••••••••••••••••"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                >
                  {showRazorpaySecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="razorpayEnabled">Enable Razorpay</Label>
                <p className="text-xs text-muted-foreground">Accept payments via Razorpay</p>
              </div>
              <Switch
                id="razorpayEnabled"
                checked={razorpaySettings.enabled}
                onCheckedChange={(checked) => setRazorpaySettings({ ...razorpaySettings, enabled: checked })}
              />
            </div>
          </CardContent>

          {/* Save Razorpay Settings Button */}
          <div className="px-6 pb-6">
            {(hasPermission.update || hasPermission.create) && <Button 
              onClick={handleSaveRazorpaySettings} 
              disabled={isSaving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Razorpay Settings
              </Button>
            }
          </div>
        </Card>
      </div>
    </div>
  )
}