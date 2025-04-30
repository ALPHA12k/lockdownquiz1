import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import QuizCard from '@/components/QuizCard';
import { useAuth } from '@/context/AuthContext';
import { supabase } from "@/lib/supabase";
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accessCode, setAccessCode] = useState('');
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [myQuizzes, setMyQuizzes] = useState<any[]>([]);
  const [publicQuizzes, setPublicQuizzes] = useState<any[]>([]);
  const [loadingMyQuizzes, setLoadingMyQuizzes] = useState(true);
  const [loadingPublicQuizzes, setLoadingPublicQuizzes] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyQuizzes();
      fetchPublicQuizzes();
    }
  }, [user]);

  const fetchMyQuizzes = async () => {
    try {
      setLoadingMyQuizzes(true);
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      setMyQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching my quizzes:', error);
    } finally {
      setLoadingMyQuizzes(false);
    }
  };

  const fetchPublicQuizzes = async () => {
    try {
      setLoadingPublicQuizzes(true);
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      setPublicQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching public quizzes:', error);
    } finally {
      setLoadingPublicQuizzes(false);
    }
  };

  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      toast({
        title: 'Code required',
        description: 'Please enter an access code',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoadingQuiz(true);
    
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('id')
        .eq('access_code', accessCode.trim())
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        window.location.href = `/take-quiz/${data.id}`;
      } else {
        toast({
          title: 'Invalid code',
          description: 'No quiz found with that access code',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error finding quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to find quiz. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const formatQuizData = (quiz: any) => {
    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description || "No description provided",
      questions: Array.isArray(quiz.questions) ? quiz.questions.length : (quiz.questions ? Object.keys(quiz.questions).length : 0),
      timeLimit: quiz.time_limit || 0,
      creator: user?.email || "Unknown",
      createdAt: quiz.created_at || new Date().toISOString(),
      accessCode: quiz.access_code,
      proctored: quiz.proctoring?.fullscreen || quiz.proctoring?.webcam,
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Access</h2>
            <form onSubmit={handleAccessCodeSubmit} className="flex gap-3">
              <Input 
                type="text" 
                placeholder="Enter access code" 
                className="input-code max-w-xs"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              />
              <Button 
                type="submit" 
                className="bg-quiz-blue hover:bg-quiz-lightBlue"
                disabled={isLoadingQuiz}
              >
                {isLoadingQuiz ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading</>
                ) : 'Join Quiz'}
              </Button>
            </form>
          </div>
          
          <div className="animate-fade-in">
            <Tabs defaultValue="my-quizzes">
              <TabsList className="mb-6">
                <TabsTrigger value="my-quizzes">My Quizzes</TabsTrigger>
                <TabsTrigger value="explore">Explore</TabsTrigger>
              </TabsList>
              
              <TabsContent value="my-quizzes" className="space-y-6">
                {loadingMyQuizzes ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-quiz-blue" />
                  </div>
                ) : myQuizzes.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                      {myQuizzes.slice(0, 4).map((quiz) => (
                        <QuizCard key={quiz.id} quiz={formatQuizData(quiz)} />
                      ))}
                    </div>
                    {myQuizzes.length > 4 && (
                      <div className="flex justify-center mt-6">
                        <Button asChild variant="outline">
                          <Link to="/my-tests">View All My Quizzes</Link>
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium mb-2">No quizzes created yet</h3>
                    <p className="text-muted-foreground mb-6">Create your first quiz to get started</p>
                    <Button asChild className="bg-quiz-blue hover:bg-quiz-lightBlue">
                      <Link to="/create-quiz">Create New Quiz</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="explore" className="space-y-6">
                {loadingPublicQuizzes ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-quiz-blue" />
                  </div>
                ) : publicQuizzes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {publicQuizzes.map((quiz) => (
                      <QuizCard key={quiz.id} quiz={formatQuizData(quiz)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium mb-2">No public quizzes available</h3>
                    <p className="text-muted-foreground">Check back later or create your own</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Right sidebar */}
        <div className="lg:w-80">
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 animate-fade-in">
            <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                className="w-full bg-quiz-blue hover:bg-quiz-lightBlue justify-start"
                asChild
              >
                <Link to="/create-quiz">Create New Quiz</Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                asChild
              >
                <Link to="/my-tests">Manage My Tests</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
