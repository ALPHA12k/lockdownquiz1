
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from "@/lib/supabase";
import { Loader2 } from 'lucide-react';
import { UserProfile } from '@/types/quiz';

const Profile = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile>({
    id: '',
    name: '',
    avatar: null
  });
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // Profile doesn't exist yet, create one
            const newProfile = {
              id: user.id,
              name: user.email?.split('@')[0] || 'User',
              avatar: null
            };
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([newProfile]);
              
            if (insertError) throw insertError;
            
            setProfileData(newProfile);
          } else {
            throw error;
          }
        } else if (profile) {
          setProfileData({
            id: profile.id,
            name: profile.name || user.email?.split('@')[0] || '',
            avatar: profile.avatar
          });
        }
      } catch (error) {
        console.error('Error with profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setLoadingProfile(false);
      }
    };
    
    if (user) {
      fetchProfileData();
    } else {
      setLoadingProfile(false);
    }
  }, [user, toast]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          avatar: profileData.avatar
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated',
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Mock stats for the profile
  const stats = {
    quizzesTaken: 15,
    averageScore: 88,
    classesJoined: 3,
    quizzesCreated: user?.role === 'teacher' ? 8 : 0
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-6 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-quiz-blue">Profile</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User info card */}
            <Card className="md:col-span-1">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={profileData.avatar || undefined} />
                  <AvatarFallback className="text-lg bg-quiz-blue text-white">
                    {getInitials(profileData.name || '')}
                  </AvatarFallback>
                </Avatar>
                
                {isEditing ? (
                  <div className="w-full space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input 
                        id="displayName"
                        value={profileData.name || ''}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        placeholder="Your name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="avatarUrl">Avatar URL</Label>
                      <Input 
                        id="avatarUrl"
                        value={profileData.avatar || ''}
                        onChange={(e) => setProfileData({...profileData, avatar: e.target.value})}
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1 bg-quiz-blue hover:bg-quiz-lightBlue"
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold mb-1">{profileData.name}</h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <div className="mt-2 inline-block px-3 py-1 rounded-full bg-quiz-softBlue text-quiz-blue text-sm font-medium">
                      Student
                    </div>
                    <Button 
                      className="mt-6 w-full" 
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Stats and activity */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>
                  Your activity and statistics on LockDownQuiz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-quiz-softBlue/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-quiz-blue">
                      {stats.quizzesTaken}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Quizzes Taken
                    </div>
                  </div>
                  
                  <div className="bg-quiz-softBlue/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-quiz-blue">
                      {stats.averageScore}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Average Score
                    </div>
                  </div>
                  
                  <div className="bg-quiz-softBlue/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-quiz-blue">
                      {stats.classesJoined}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Classes Joined
                    </div>
                  </div>
                  
                  <div className="bg-quiz-softBlue/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-quiz-blue">
                      {stats.quizzesCreated}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Quizzes Created
                    </div>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <h3 className="font-medium">Recent Activity</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg hover:bg-muted">
                      <div>
                        <div className="font-medium">Completed Math Quiz</div>
                        <div className="text-sm text-muted-foreground">Score: 92%</div>
                      </div>
                      <div className="text-sm text-muted-foreground">2 days ago</div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg hover:bg-muted">
                      <div>
                        <div className="font-medium">Joined History 101</div>
                        <div className="text-sm text-muted-foreground">New classroom</div>
                      </div>
                      <div className="text-sm text-muted-foreground">5 days ago</div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg hover:bg-muted">
                      <div>
                        <div className="font-medium">Completed Science Exam</div>
                        <div className="text-sm text-muted-foreground">Score: 85%</div>
                      </div>
                      <div className="text-sm text-muted-foreground">1 week ago</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
