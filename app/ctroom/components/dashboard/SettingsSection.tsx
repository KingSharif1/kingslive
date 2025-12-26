"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabase"
import { 
  Settings, Bell, Palette, Shield, Database, Mail, 
  Smartphone, Clock, Save, RefreshCw, Trash2, Download,
  Moon, Sun, Monitor, User, Key, AlertCircle, Sparkles, Zap, Brain
} from "lucide-react"

interface SettingsSectionProps {
  addToast: (toast: { type: 'success' | 'error' | 'info'; title: string; message?: string }) => void
}

interface UserSettings {
  email_notifications: boolean
  comment_notifications: boolean
  task_reminders: boolean
  weekly_digest: boolean
  auto_save: boolean
  default_priority: 'high' | 'medium' | 'low'
  calendar_start_day: 'sunday' | 'monday'
  notification_email: string
}

const DEFAULT_SETTINGS: UserSettings = {
  email_notifications: true,
  comment_notifications: true,
  task_reminders: true,
  weekly_digest: false,
  auto_save: true,
  default_priority: 'medium',
  calendar_start_day: 'sunday',
  notification_email: ''
}

export function SettingsSection({ addToast }: SettingsSectionProps) {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  // Load settings from localStorage and user data
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      try {
        // Load from localStorage
        const savedSettings = localStorage.getItem('dashboard_settings')
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings))
        }

        // Get user email
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          setUserEmail(user.email)
          if (!settings.notification_email) {
            setSettings(prev => ({ ...prev, notification_email: user.email || '' }))
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  // Track changes
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true)
    try {
      // Save to localStorage
      localStorage.setItem('dashboard_settings', JSON.stringify(settings))
      
      // If email notifications are enabled, validate email
      if (settings.email_notifications && !settings.notification_email) {
        addToast({ type: 'error', title: 'Please enter a notification email' })
        setIsSaving(false)
        return
      }

      setHasChanges(false)
      addToast({ type: 'success', title: 'Settings saved successfully!' })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to save settings' })
    } finally {
      setIsSaving(false)
    }
  }

  // Reset to defaults
  const resetSettings = () => {
    setSettings({ ...DEFAULT_SETTINGS, notification_email: userEmail })
    setHasChanges(true)
    addToast({ type: 'info', title: 'Settings reset to defaults' })
  }

  // Export data
  const exportData = async () => {
    try {
      const { data: tasks } = await supabase.from('tasks').select('*')
      const { data: ideas } = await supabase.from('ideas').select('*')
      
      const exportData = {
        exported_at: new Date().toISOString(),
        settings,
        tasks: tasks || [],
        ideas: ideas || []
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kingslive-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      addToast({ type: 'success', title: 'Data exported successfully!' })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to export data' })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">Manage your preferences and account settings</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
              Unsaved changes
            </Badge>
          )}
          <Button onClick={saveSettings} disabled={isSaving || !hasChanges}>
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ai-usage" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai-usage" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI Usage</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Usage Tab */}
        <TabsContent value="ai-usage">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Token Usage
                </CardTitle>
                <CardDescription>Monitor your AI assistant token consumption</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* OpenAI Usage */}
                <div className="p-4 rounded-lg border space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Zap className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">OpenAI (GPT-4o)</p>
                      <p className="text-sm text-muted-foreground">GPT-4o Mini & GPT-4o models</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">This Session</p>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-xs text-muted-foreground">tokens</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Estimated Cost</p>
                      <p className="text-2xl font-bold">$0.00</p>
                      <p className="text-xs text-muted-foreground">USD</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 GPT-4o Mini: ~$0.15/1M input, ~$0.60/1M output • GPT-4o: ~$2.50/1M input, ~$10/1M output
                  </p>
                </div>

                {/* Gemini Usage */}
                <div className="p-4 rounded-lg border space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Brain className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Google Gemini</p>
                      <p className="text-sm text-muted-foreground">Gemini Flash & Lite models</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">This Session</p>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-xs text-muted-foreground">tokens</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Estimated Cost</p>
                      <p className="text-2xl font-bold">$0.00</p>
                      <p className="text-xs text-muted-foreground">USD</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Gemini Flash: Free tier available • Gemini Pro: ~$0.125/1M input, ~$0.375/1M output
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Token Tracking</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Token usage is tracked per chat session. Historical usage data and detailed analytics 
                        will be available in a future update. For now, you can see real-time usage in the chat sidebar.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Keys Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Configuration
                </CardTitle>
                <CardDescription>Your AI API keys are configured in environment variables</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">OpenAI API</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Configured
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">OPENAI_API_KEY in .env.local</p>
                </div>
                <div className="p-4 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Google Gemini API</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Configured
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">GEMINI_API_KEY in .env.local</p>
                </div>
                <div className="p-4 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Google Search</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Optional
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">GOOGLE_SEARCH_CX in .env.local (uses GEMINI_API_KEY)</p>
                </div>
                <div className="p-4 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">GitHub API</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Optional
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">GITHUB_TOKEN in .env.local</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email for notifications */}
              <div className="space-y-2">
                <Label htmlFor="notification-email" className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Notification Email
                </Label>
                <Input
                  id="notification-email"
                  type="email"
                  placeholder="your@email.com"
                  value={settings.notification_email}
                  onChange={(e) => updateSetting('notification_email', e.target.value)}
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground">Email address for receiving notifications</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                  </div>
                  <Switch 
                    id="email-notifications" 
                    checked={settings.email_notifications} 
                    onCheckedChange={(v) => updateSetting('email_notifications', v)} 
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Bell className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <Label htmlFor="comment-notifications" className="font-medium">New Comment Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified when someone comments on your posts</p>
                    </div>
                  </div>
                  <Switch 
                    id="comment-notifications" 
                    checked={settings.comment_notifications} 
                    onCheckedChange={(v) => updateSetting('comment_notifications', v)} 
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <Label htmlFor="task-reminders" className="font-medium">Task Reminders</Label>
                      <p className="text-sm text-muted-foreground">Receive reminders for upcoming and overdue tasks</p>
                    </div>
                  </div>
                  <Switch 
                    id="task-reminders" 
                    checked={settings.task_reminders} 
                    onCheckedChange={(v) => updateSetting('task_reminders', v)} 
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <Mail className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <Label htmlFor="weekly-digest" className="font-medium">Weekly Digest</Label>
                      <p className="text-sm text-muted-foreground">Receive a weekly summary of your activity</p>
                    </div>
                  </div>
                  <Switch 
                    id="weekly-digest" 
                    checked={settings.weekly_digest} 
                    onCheckedChange={(v) => updateSetting('weekly_digest', v)} 
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Push notifications require additional setup. For now, email notifications are the primary method.
                      SMS/Text notifications can be added in a future update.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how the dashboard looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="font-medium">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Sun className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">Light</p>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Moon className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">Dark</p>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === 'system' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Monitor className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">System</p>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preferences
              </CardTitle>
              <CardDescription>Configure default behaviors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label htmlFor="auto-save" className="font-medium">Auto Save</Label>
                  <p className="text-sm text-muted-foreground">Automatically save changes while editing</p>
                </div>
                <Switch 
                  id="auto-save" 
                  checked={settings.auto_save} 
                  onCheckedChange={(v) => updateSetting('auto_save', v)} 
                />
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Default Task Priority</Label>
                <Select 
                  value={settings.default_priority} 
                  onValueChange={(v: 'high' | 'medium' | 'low') => updateSetting('default_priority', v)}
                >
                  <SelectTrigger className="max-w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        High
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Low
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Default priority when creating new tasks</p>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Calendar Start Day</Label>
                <Select 
                  value={settings.calendar_start_day} 
                  onValueChange={(v: 'sunday' | 'monday') => updateSetting('calendar_start_day', v)}
                >
                  <SelectTrigger className="max-w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunday">Sunday</SelectItem>
                    <SelectItem value="monday">Monday</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">First day of the week in calendar view</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Export your data or reset settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Download className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Export Data</p>
                    <p className="text-sm text-muted-foreground">Download all your tasks, ideas, and settings</p>
                  </div>
                </div>
                <Button variant="outline" onClick={exportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as JSON
                </Button>
              </div>

              <div className="p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <RefreshCw className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Reset Settings</p>
                    <p className="text-sm text-muted-foreground">Reset all settings to their default values</p>
                  </div>
                </div>
                <Button variant="outline" onClick={resetSettings}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>

              <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-400">Danger Zone</p>
                    <p className="text-sm text-muted-foreground">Permanently delete all your data. This cannot be undone.</p>
                  </div>
                </div>
                <Button variant="destructive" disabled>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Data
                </Button>
                <p className="text-xs text-muted-foreground">Contact support to delete your account</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
