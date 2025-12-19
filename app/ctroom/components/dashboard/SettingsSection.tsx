"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface SettingsSectionProps {
  addToast: (toast: { type: 'success' | 'error' | 'info'; title: string; message?: string }) => void
}

export function SettingsSection({ addToast }: SettingsSectionProps) {
  const [darkMode, setDarkMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [autoSave, setAutoSave] = useState(true)
  
  const handleSaveSettings = () => {
    addToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Your settings have been updated successfully'
    })
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Manage your account settings and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Enable dark mode for the dashboard</p>
            </div>
            <Switch 
              id="dark-mode" 
              checked={darkMode} 
              onCheckedChange={setDarkMode} 
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notifications</h3>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email notifications for comments and messages</p>
            </div>
            <Switch 
              id="email-notifications" 
              checked={emailNotifications} 
              onCheckedChange={setEmailNotifications} 
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Editor</h3>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-save" className="font-medium">Auto Save</Label>
              <p className="text-sm text-muted-foreground">Automatically save drafts while editing</p>
            </div>
            <Switch 
              id="auto-save" 
              checked={autoSave} 
              onCheckedChange={setAutoSave} 
            />
          </div>
        </div>
        
        <div className="pt-4">
          <Button onClick={handleSaveSettings}>Save Settings</Button>
        </div>
      </CardContent>
    </Card>
  )
}
