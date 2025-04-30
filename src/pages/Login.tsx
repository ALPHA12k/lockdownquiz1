
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoogleLoginButton from '@/components/LoginForm';
import EmailLoginForm from '@/components/EmailLoginForm';
import RegisterForm from '@/components/RegisterForm';
import GuestAccessForm from '@/components/GuestAccessForm';
import { Separator } from '@/components/ui/separator';

const Login = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('login');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-white to-quiz-softBlue/30">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome to LockDownQuiz</CardTitle>
            <CardDescription>Secure, effective online testing platform</CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="guest">Guest</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-4">
                <EmailLoginForm />
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                
                <GoogleLoginButton />
              </TabsContent>
              
              <TabsContent value="register" className="mt-4">
                <RegisterForm />
              </TabsContent>
              
              <TabsContent value="guest" className="mt-4">
                <CardDescription className="mb-4 text-center">
                  Access a test without creating an account
                </CardDescription>
                <GuestAccessForm />
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            {activeTab === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button 
                  type="button" 
                  className="text-primary hover:underline" 
                  onClick={() => setActiveTab('register')}
                >
                  Register
                </button>
              </p>
            ) : activeTab === 'register' ? (
              <p>
                Already have an account?{' '}
                <button 
                  type="button" 
                  className="text-primary hover:underline" 
                  onClick={() => setActiveTab('login')}
                >
                  Login
                </button>
              </p>
            ) : (
              <p>
                Want to save your results?{' '}
                <button 
                  type="button" 
                  className="text-primary hover:underline" 
                  onClick={() => setActiveTab('register')}
                >
                  Create an account
                </button>
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
