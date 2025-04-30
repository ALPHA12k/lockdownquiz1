
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { User, KeyRound } from 'lucide-react';

const GuestAccessForm = () => {
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !accessCode) {
      toast({
        title: "Missing information",
        description: "Please enter your name and the test access code",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Check if the test exists with this access code
      const { data: test, error } = await supabase
        .from('tests')
        .select('id, title, questions')
        .eq('access_code', accessCode)
        .single();
      
      if (error || !test) {
        toast({
          title: "Invalid access code",
          description: "No test found with this access code. Please check and try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Verify that the test has questions
      const questionsArray = Array.isArray(test.questions) 
        ? test.questions 
        : typeof test.questions === 'string' 
          ? JSON.parse(test.questions) 
          : [];
      
      if (questionsArray.length === 0) {
        toast({
          title: "Test not ready",
          description: "This test doesn't have any questions yet.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Store guest info in localStorage for the test
      localStorage.setItem('guestName', name);
      localStorage.setItem('guestAccessCode', accessCode);
      
      toast({
        title: "Access granted!",
        description: `You're now accessing "${test.title}" as ${name}`,
      });
      
      // Navigate to the test
      navigate(`/take-quiz/${test.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="guestName">Your Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="guestName"
            placeholder="Enter your name"
            className="pl-10"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="accessCode">Test Access Code</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="accessCode"
            placeholder="Enter test access code"
            className="pl-10"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
      
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Accessing..." : "Access Test as Guest"}
      </Button>
    </form>
  );
};

export default GuestAccessForm;
