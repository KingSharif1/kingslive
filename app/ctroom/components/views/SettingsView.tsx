import React, { useState } from 'react';
import { User, Bell, Key, Shield, Save, Eye, EyeOff } from 'lucide-react';
import { UserSettings } from '../../types';
import { cn } from '@/lib/utils';

interface SettingsViewProps {
    settings: UserSettings;
    onSave: (settings: UserSettings) => void;
}

type SettingsTab = 'profile' | 'preferences' | 'api-keys' | 'privacy';

export const SettingsView = ({ settings, onSave }: SettingsViewProps) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
    const [showKeys, setShowKeys] = useState({ openai: false, github: false, google: false });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save
        onSave(localSettings);
        setIsSaving(false);
    };

    const tabs: { id: SettingsTab; label: string; icon: any }[] = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'preferences', label: 'Preferences', icon: Bell },
        { id: 'api-keys', label: 'API Keys', icon: Key },
        { id: 'privacy', label: 'Privacy', icon: Shield },
    ];

    const maskApiKey = (key?: string) => {
        if (!key) return '';
        return key.slice(0, 8) + '••••••••' + key.slice(-4);
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap",
                            activeTab === tab.id
                                ? "border-primary text-primary font-medium"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-card rounded-xl border border-border p-6 min-h-[400px]">
                {activeTab === 'profile' && (
                    <div className="space-y-6 max-w-2xl">
                        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Name</label>
                                <input
                                    type="text"
                                    value={localSettings.profile.name}
                                    onChange={e => setLocalSettings({
                                        ...localSettings,
                                        profile: { ...localSettings.profile, name: e.target.value }
                                    })}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    value={localSettings.profile.email}
                                    onChange={e => setLocalSettings({
                                        ...localSettings,
                                        profile: { ...localSettings.profile, email: e.target.value }
                                    })}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Avatar URL (optional)</label>
                                <input
                                    type="url"
                                    value={localSettings.profile.avatar || ''}
                                    onChange={e => setLocalSettings({
                                        ...localSettings,
                                        profile: { ...localSettings.profile, avatar: e.target.value }
                                    })}
                                    placeholder="https://..."
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'preferences' && (
                    <div className="space-y-6 max-w-2xl">
                        <h2 className="text-xl font-semibold mb-4">Preferences</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                                <div>
                                    <div className="font-medium">Notifications</div>
                                    <div className="text-sm text-muted-foreground">Receive notifications for updates</div>
                                </div>
                                <button
                                    onClick={() => setLocalSettings({
                                        ...localSettings,
                                        preferences: { ...localSettings.preferences, notifications: !localSettings.preferences.notifications }
                                    })}
                                    className={cn(
                                        "relative w-12 h-6 rounded-full transition-colors",
                                        localSettings.preferences.notifications ? "bg-primary" : "bg-border"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                                        localSettings.preferences.notifications && "translate-x-6"
                                    )} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                                <div>
                                    <div className="font-medium">Auto-save</div>
                                    <div className="text-sm text-muted-foreground">Automatically save changes</div>
                                </div>
                                <button
                                    onClick={() => setLocalSettings({
                                        ...localSettings,
                                        preferences: { ...localSettings.preferences, autoSave: !localSettings.preferences.autoSave }
                                    })}
                                    className={cn(
                                        "relative w-12 h-6 rounded-full transition-colors",
                                        localSettings.preferences.autoSave ? "bg-primary" : "bg-border"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                                        localSettings.preferences.autoSave && "translate-x-6"
                                    )} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                                <div>
                                    <div className="font-medium">Sidebar Collapsed by Default</div>
                                    <div className="text-sm text-muted-foreground">Start with collapsed sidebar</div>
                                </div>
                                <button
                                    onClick={() => setLocalSettings({
                                        ...localSettings,
                                        preferences: { ...localSettings.preferences, sidebarCollapsed: !localSettings.preferences.sidebarCollapsed }
                                    })}
                                    className={cn(
                                        "relative w-12 h-6 rounded-full transition-colors",
                                        localSettings.preferences.sidebarCollapsed ? "bg-primary" : "bg-border"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                                        localSettings.preferences.sidebarCollapsed && "translate-x-6"
                                    )} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'api-keys' && (
                    <div className="space-y-6 max-w-2xl">
                        <h2 className="text-xl font-semibold mb-4">API Keys</h2>
                        <p className="text-sm text-muted-foreground">Manage your API keys for external integrations</p>

                        <div className="space-y-4">
                            {/* OpenAI */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">OpenAI API Key</label>
                                <div className="flex gap-2">
                                    <input
                                        type={showKeys.openai ? "text" : "password"}
                                        value={localSettings.apiKeys.openai || ''}
                                        onChange={e => setLocalSettings({
                                            ...localSettings,
                                            apiKeys: { ...localSettings.apiKeys, openai: e.target.value }
                                        })}
                                        placeholder="sk-..."
                                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                                    />
                                    <button
                                        onClick={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
                                        className="px-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                                    >
                                        {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* GitHub */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">GitHub Token</label>
                                <div className="flex gap-2">
                                    <input
                                        type={showKeys.github ? "text" : "password"}
                                        value={localSettings.apiKeys.github || ''}
                                        onChange={e => setLocalSettings({
                                            ...localSettings,
                                            apiKeys: { ...localSettings.apiKeys, github: e.target.value }
                                        })}
                                        placeholder="ghp_..."
                                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                                    />
                                    <button
                                        onClick={() => setShowKeys({ ...showKeys, github: !showKeys.github })}
                                        className="px-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                                    >
                                        {showKeys.github ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Google */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Google API Key</label>
                                <div className="flex gap-2">
                                    <input
                                        type={showKeys.google ? "text" : "password"}
                                        value={localSettings.apiKeys.google || ''}
                                        onChange={e => setLocalSettings({
                                            ...localSettings,
                                            apiKeys: { ...localSettings.apiKeys, google: e.target.value }
                                        })}
                                        placeholder="AIza..."
                                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                                    />
                                    <button
                                        onClick={() => setShowKeys({ ...showKeys, google: !showKeys.google })}
                                        className="px-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                                    >
                                        {showKeys.google ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'privacy' && (
                    <div className="space-y-6 max-w-2xl">
                        <h2 className="text-xl font-semibold mb-4">Privacy & Data</h2>

                        <div className="space-y-4">
                            <div className="p-4 bg-secondary/50 rounded-lg">
                                <h3 className="font-medium mb-2">Data Storage</h3>
                                <p className="text-sm text-muted-foreground">Your data is stored locally and in Supabase. You have full control over your data.</p>
                            </div>

                            <div className="p-4 bg-secondary/50 rounded-lg">
                                <h3 className="font-medium mb-2">Export Data</h3>
                                <p className="text-sm text-muted-foreground mb-3">Download all your data in JSON format</p>
                                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
                                    Export All Data
                                </button>
                            </div>

                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <h3 className="font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
                                <p className="text-sm text-muted-foreground mb-3">Permanently delete all your data. This action cannot be undone.</p>
                                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                                    Delete All Data
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};
