import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

const Settings = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    defaultPublic: false,
    defaultProctoring: false,
  });

  useEffect(() => {
    // Load settings from local storage or default values
    const storedSettings = localStorage.getItem('testSettings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  useEffect(() => {
    // Save settings to local storage whenever they change
    localStorage.setItem('testSettings', JSON.stringify(settings));
  }, [settings]);
  
  // Fix the onCheckedChange handler for switch components
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        <div className="space-y-8">
          {/* Account Settings section */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Account Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Manage your profile information and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p>User ID: {user?.id}</p>
                <p>Email: {user?.email}</p>
                {/* Add more account settings here */}
              </CardContent>
            </Card>
          </div>
          
          {/* Test Settings section - fix the switch handlers */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Test Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>Default Test Settings</CardTitle>
                <CardDescription>
                  Configure default settings for new tests you create.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="defaultPublic">Make tests public by default</Label>
                      <p className="text-sm text-muted-foreground">
                        Tests will be set to public when created
                      </p>
                    </div>
                    <Switch
                      id="defaultPublic"
                      checked={settings.defaultPublic}
                      onCheckedChange={(checked: boolean) => 
                        setSettings({...settings, defaultPublic: checked})
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="requireProctoring">Enable proctoring by default</Label>
                      <p className="text-sm text-muted-foreground">
                        Tests will require proctoring when created
                      </p>
                    </div>
                    <Switch 
                      id="requireProctoring"
                      checked={settings.defaultProctoring}
                      onCheckedChange={(checked: boolean) => 
                        setSettings({...settings, defaultProctoring: checked})
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Appearance Settings section */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Appearance Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>Theme Preferences</CardTitle>
                <CardDescription>
                  Customize the look and feel of your application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add theme settings here */}
                <p>Coming soon!</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
