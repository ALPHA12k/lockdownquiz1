import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from "@/lib/supabase";
import { Loader2, AlertTriangle } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Question, QuizData } from '@/types/quiz';

const TakeQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [quizLoading, setQuizLoading] = useState(true);
  const [fullscreenWarning, setFullscreenWarning] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamStatus, setWebcamStatus] = useState<"pending" | "approved" | "denied">("pending");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [guestAccessCode, setGuestAccessCode] = useState<string | null>(null);

  // Get guest info if available
  useEffect(() => {
    const storedGuestName = localStorage.getItem('guestName');
    const storedAccessCode = localStorage.getItem('guestAccessCode');
    
    if (storedGuestName) {
      setGuestName(storedGuestName);
    }
    
    if (storedAccessCode) {
      setGuestAccessCode(storedAccessCode);
    }
  }, []);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) return;

      try {
        setQuizLoading(true);
        const { data: quizData, error } = await supabase
          .from('tests')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!quizData) {
          toast({
            title: 'Quiz not found',
            description: 'The requested quiz could not be found.',
            variant: 'destructive',
          });
          navigate('/home');
          return;
        }

        // Parse questions if it's stored as a string
        let parsedQuestions: Question[] = [];
        
        if (typeof quizData.questions === 'string') {
          try {
            parsedQuestions = JSON.parse(quizData.questions);
          } catch (e) {
            console.error('Error parsing questions:', e);
            parsedQuestions = [];
          }
        } else if (Array.isArray(quizData.questions)) {
          // Type assertion since we know the structure matches our Question type
          parsedQuestions = quizData.questions as unknown as Question[];
        } else {
          console.error('Questions is not valid:', quizData.questions);
          parsedQuestions = [];
        }
        
        // Create a properly typed quiz object
        const typedQuiz: QuizData = {
          ...quizData,
          questions: parsedQuestions,
          proctoring: quizData.proctoring as QuizData['proctoring']
        };

        setQuiz(typedQuiz);
        
        // Set the timer if there's a time limit
        if (typedQuiz.time_limit) {
          setTimeLeft(typedQuiz.time_limit * 60);
        }

        // Check if quiz requires proctoring
        const proctoring = typedQuiz.proctoring;
        if (proctoring && (proctoring.fullscreen || proctoring.webcam)) {
          setShowSetup(true);
        } else {
          setSetupComplete(true);
        }
        
        setQuizLoading(false);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast({
          title: 'Error',
          description: 'Failed to load the quiz.',
          variant: 'destructive',
        });
        navigate('/home');
      }
    };

    fetchQuiz();
  }, [id, navigate, toast]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isFinished) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null && prev > 0) ? prev - 1 : 0);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !isFinished) {
      handleSubmit();
    }
  }, [timeLeft, isFinished]);

  // Fullscreen handling for proctored exams
  useEffect(() => {
    if (!quiz || !setupComplete) return;
    
    // Only monitor fullscreen if the exam requires it
    const proctoring = quiz.proctoring as { fullscreen?: boolean; webcam?: boolean } | null;
    if (proctoring?.fullscreen) {
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement && setupComplete) {
          setFullscreenWarning(true);
          // Give the user 5 seconds to return to fullscreen
          setTimeout(() => {
            if (!document.fullscreenElement) {
              // Auto-submit if they don't return to fullscreen
              handleSubmit();
            }
          }, 5000);
        } else {
          setFullscreenWarning(false);
        }
      };
      
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
  }, [quiz, setupComplete]);

  // Record quiz attempt 
  useEffect(() => {
    const recordAttempt = async () => {
      if (!quiz) return;
      
      try {
        const attemptData = {
          test_id: quiz.id,
          user_id: user?.id || null,
          guest_name: guestName,
          started_at: new Date().toISOString(),
        };
        
        await supabase.from('test_attempts').insert([attemptData]);
      } catch (error) {
        console.error('Error recording attempt:', error);
      }
    };
    
    if ((quiz && user) || (quiz && guestName)) {
      recordAttempt();
    }
  }, [quiz, user, guestName]);

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    
    if (mediaStream) {
      // Stop all tracks from the media stream
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
      setWebcamActive(false);
    }
    
    setIsSubmitting(true);
    
    // Calculate score
    let correctCount = 0;
    let totalQuestions = 0;
    let questionScores: Record<string, number> = {};
    
    if (quiz && quiz.questions && Array.isArray(quiz.questions)) {
      totalQuestions = quiz.questions.length;
      
      quiz.questions.forEach((question) => {
        const userAnswer = answers[question.id];
        let isCorrect = false;
        
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
          isCorrect = userAnswer === question.correctAnswer;
        } else if (question.type === 'text') {
          isCorrect = userAnswer?.toLowerCase() === question.correctAnswer?.toString().toLowerCase();
        } else if (question.type === 'line-answer') {
          // Line answer is for open-ended responses, no automatic scoring
          isCorrect = false;
        } else if (question.type === 'multiple-answer') {
          if (Array.isArray(userAnswer) && 
              Array.isArray(question.correctAnswer) && 
              userAnswer.length === question.correctAnswer.length && 
              userAnswer.every((ans: string) => question.correctAnswer?.includes(ans))) {
            isCorrect = true;
          }
        }
        
        questionScores[question.id] = isCorrect ? 1 : 0;
        if (isCorrect) correctCount++;
      });
    }
    
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    
    try {
      // Update test attempt in Supabase
      const attemptData = {
        test_id: quiz.id,
        user_id: user?.id || null,
        guest_name: guestName || null,
        answers: answers,
        score: score,
        question_scores: questionScores,
        completed_at: new Date().toISOString(),
      };
      
      // Try to update existing attempt first
      let { error } = await supabase.from('test_attempts')
        .update({
          answers,
          score,
          question_scores: questionScores,
          completed_at: new Date().toISOString()
        })
        .eq('test_id', quiz.id)
        .eq(user ? 'user_id' : 'guest_name', user ? user.id : guestName);
      
      // If there's no attempt to update, insert a new one
      if (error) {
        await supabase.from('test_attempts').insert([attemptData]);
      }
    } catch (error) {
      console.error('Error saving attempt:', error);
    } finally {
      // Exit fullscreen mode if needed
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      
      setTimeout(() => {
        setIsSubmitting(false);
        setIsFinished(true);
        
        toast({
          title: 'Quiz Submitted',
          description: `Your score: ${score}%`,
        });
      }, 1500);
    }
  };

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      return true;
    } catch (error) {
      console.error('Error requesting fullscreen:', error);
      toast({
        title: 'Fullscreen Error',
        description: 'Failed to enter fullscreen mode. Please try again or use a different browser.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const requestWebcamAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMediaStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setWebcamActive(true);
      setWebcamStatus("approved");
      return true;
    } catch (error) {
      console.error('Error accessing webcam:', error);
      setWebcamStatus("denied");
      toast({
        title: 'Camera Access Denied',
        description: 'This exam requires camera access. Please allow camera permissions and try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleStartExam = async () => {
    let canStart = true;
    
    // Check proctoring requirements
    if (quiz?.proctoring) {
      if (quiz.proctoring.fullscreen) {
        const fullscreenSuccess = await enterFullscreen();
        if (!fullscreenSuccess) canStart = false;
      }
      
      if (quiz.proctoring.webcam) {
        const webcamSuccess = await requestWebcamAccess();
        if (!webcamSuccess) canStart = false;
      }
    }
    
    if (canStart) {
      setSetupComplete(true);
      setShowSetup(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if the user is allowed to access this quiz
  if (loading || quizLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-quiz-blue" />
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Allow either authenticated users or users with guest access
  if (!isAuthenticated && !guestName) {
    return <Navigate to="/" replace />;
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Quiz not found</p>
      </div>
    );
  }

  // Setup screen for proctored exams
  if (showSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-xl text-quiz-blue">Exam Setup</CardTitle>
            <CardDescription>
              Please complete the setup before starting your exam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-medium">Quiz Information</h3>
              <p className="text-lg font-semibold">{quiz.title}</p>
              <p className="text-sm text-muted-foreground">{quiz.description}</p>
            </div>
            
            {(quiz.proctoring as any)?.webcam && (
              <div className="space-y-4">
                <h3 className="font-medium flex items-center">
                  <span className="text-quiz-blue mr-2">•</span>
                  Camera Check Required
                </h3>
                
                {webcamStatus === "pending" ? (
                  <div className="bg-muted/50 rounded-lg p-4 text-center space-y-3">
                    <p>This exam requires camera access. Please click the button below to enable your camera.</p>
                    <Button 
                      onClick={requestWebcamAccess} 
                      className="bg-quiz-blue hover:bg-quiz-lightBlue"
                    >
                      Enable Camera
                    </Button>
                  </div>
                ) : webcamStatus === "approved" ? (
                  <div className="space-y-3">
                    <div className="bg-muted/50 rounded-lg p-2 text-center overflow-hidden">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        muted 
                        className="w-full max-h-[240px] rounded"
                      />
                    </div>
                    <p className="text-sm text-green-600 text-center">
                      ✓ Camera access granted
                    </p>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Camera access was denied. You must grant camera access to continue.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            
            {(quiz.proctoring as any)?.fullscreen && (
              <div className="space-y-2">
                <h3 className="font-medium flex items-center">
                  <span className="text-quiz-blue mr-2">•</span>
                  Fullscreen Mode Required
                </h3>
                <p className="text-sm text-muted-foreground">
                  This exam must be taken in fullscreen mode. Exiting fullscreen mode during the exam may result in automatic submission.
                </p>
              </div>
            )}
            
            <div className="pt-4">
              <Alert>
                <AlertDescription className="text-sm">
                  By proceeding, you agree to follow the exam rules and understand that violations may result in disqualification.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-quiz-blue hover:bg-quiz-lightBlue"
              onClick={handleStartExam}
              disabled={(quiz.proctoring as any)?.webcam && webcamStatus !== "approved"}
            >
              Start Exam
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Results screen
  if (isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Quiz Complete!</CardTitle>
            <CardDescription>Thank you for completing {quiz.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-lg font-medium">Your answers have been submitted</p>
              <p className="text-sm text-muted-foreground">
                Your instructor will review and share your results.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => navigate('/home')}
            >
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Quiz taking screen
  return (
    <div className="min-h-screen bg-background p-4">
      {!setupComplete && (
        <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Preparing Exam</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto" />
              <p className="mt-4">Setting up your exam environment...</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {fullscreenWarning && (
        <Dialog open={fullscreenWarning} onOpenChange={setFullscreenWarning}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive">⚠️ Fullscreen Exit Detected</DialogTitle>
              <DialogDescription>
                You have exited fullscreen mode. Please return to fullscreen immediately or your exam will be automatically submitted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-center sm:justify-center">
              <Button 
                onClick={enterFullscreen}
                className="bg-quiz-blue hover:bg-quiz-lightBlue"
              >
                Return to Fullscreen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      <div className="max-w-3xl mx-auto">
        {/* Quiz header */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-lg">{quiz.title}</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </p>
          </div>
          <div className="text-right">
            {timeLeft !== null && (
              <div className={`font-mono font-bold text-xl ${timeLeft < 60 ? 'text-red-500' : ''}`}>
                {formatTime(timeLeft)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Time Remaining</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mb-6">
          <Progress value={(currentQuestionIndex + 1) / quiz.questions.length * 100} className="h-2" />
        </div>
        
        {/* Webcam preview if active */}
        {webcamActive && (quiz.proctoring as any)?.webcam && (
          <div className="mb-4">
            <div className="bg-muted/50 rounded-lg p-2 shadow-sm overflow-hidden w-32 h-24 fixed bottom-4 right-4 z-10">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                className="w-full h-full object-cover rounded"
              />
            </div>
          </div>
        )}
        
        {/* Question card */}
        {quiz.questions && quiz.questions.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{quiz.questions[currentQuestionIndex].text}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Multiple choice question */}
              {quiz.questions[currentQuestionIndex].type === 'multiple-choice' && (
                <RadioGroup
                  value={answers[quiz.questions[currentQuestionIndex].id] || ''}
                  onValueChange={(value) => handleAnswerChange(quiz.questions[currentQuestionIndex].id, value)}
                >
                  {quiz.questions[currentQuestionIndex].options?.map((option: string) => (
                    <div key={option} className="flex items-center space-x-2 p-3 rounded-md hover:bg-muted">
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              
              {/* True/False question */}
              {quiz.questions[currentQuestionIndex].type === 'true-false' && (
                <RadioGroup
                  value={answers[quiz.questions[currentQuestionIndex].id] || ''}
                  onValueChange={(value) => handleAnswerChange(quiz.questions[currentQuestionIndex].id, value)}
                  className="flex flex-col space-y-2"
                >
                  {quiz.questions[currentQuestionIndex].options?.map((option: string) => (
                    <div key={option} className="flex items-center space-x-2 p-3 rounded-md hover:bg-muted">
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              
              {/* Multiple answer question */}
              {quiz.questions[currentQuestionIndex].type === 'multiple-answer' && (
                <div className="space-y-2">
                  {quiz.questions[currentQuestionIndex].options?.map((option: string) => (
                    <div key={option} className="flex items-center space-x-2 p-3 rounded-md hover:bg-muted">
                      <Checkbox
                        id={option}
                        checked={(answers[quiz.questions[currentQuestionIndex].id] || []).includes(option)}
                        onCheckedChange={(checked) => {
                          const currentAnswers = answers[quiz.questions[currentQuestionIndex].id] || [];
                          let newAnswers;
                          
                          if (checked) {
                            newAnswers = [...currentAnswers, option];
                          } else {
                            newAnswers = currentAnswers.filter((ans: string) => ans !== option);
                          }
                          
                          handleAnswerChange(quiz.questions[currentQuestionIndex].id, newAnswers);
                        }}
                      />
                      <Label htmlFor={option} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Text answer question */}
              {quiz.questions[currentQuestionIndex].type === 'text' && (
                <div className="space-y-2">
                  <Input
                    placeholder="Type your answer here"
                    value={answers[quiz.questions[currentQuestionIndex].id] || ''}
                    onChange={(e) => handleAnswerChange(quiz.questions[currentQuestionIndex].id, e.target.value)}
                  />
                </div>
              )}
              
              {/* Line answer question (new type) */}
              {quiz.questions[currentQuestionIndex].type === 'line-answer' && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your answer here"
                    rows={4}
                    value={answers[quiz.questions[currentQuestionIndex].id] || ''}
                    onChange={(e) => handleAnswerChange(quiz.questions[currentQuestionIndex].id, e.target.value)}
                    className="resize-none"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              
              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <Button onClick={handleNextQuestion}>
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              )}
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p>No questions found for this quiz.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TakeQuiz;
