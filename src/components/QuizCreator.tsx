import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from "@/lib/supabase";
import { Shield, FileText } from 'lucide-react';
import { Question } from '@/types/quiz';

const QuizCreator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Quiz details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('15');
  const [isPublic, setIsPublic] = useState(false);
  const [proctoring, setProctoring] = useState({
    fullscreen: false,
    webcam: false
  });
  
  // Questions management
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: crypto.randomUUID(),
    text: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: '',
  });
  
  const questionTypes = [
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'true-false', label: 'True/False' },
    { value: 'text', label: 'Short Text Answer' },
    { value: 'multiple-answer', label: 'Multiple Answer' },
    { value: 'line-answer', label: 'Long Text Response' },
  ];

  const handleQuestionTypeChange = (type: Question['type']) => {
    let newQuestion: Question = {
      ...currentQuestion,
      type,
    };
    
    // Adjust the question structure based on type
    if (type === 'multiple-choice') {
      newQuestion.options = ['', '', '', ''];
      newQuestion.correctAnswer = '';
    } else if (type === 'true-false') {
      newQuestion.options = ['True', 'False'];
      newQuestion.correctAnswer = 'True';
    } else if (type === 'text') {
      delete newQuestion.options;
      newQuestion.correctAnswer = '';
    } else if (type === 'multiple-answer') {
      newQuestion.options = ['', '', '', ''];
      newQuestion.correctAnswer = [];
    } else if (type === 'line-answer') {
      delete newQuestion.options;
      newQuestion.correctAnswer = '';
    }
    
    setCurrentQuestion(newQuestion);
  };

  const handleOptionChange = (index: number, value: string) => {
    if (!currentQuestion.options) return;
    
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions,
    });
  };

  const handleCorrectAnswerChange = (value: string) => {
    setCurrentQuestion({
      ...currentQuestion,
      correctAnswer: value,
    });
  };

  const handleMultipleAnswerChange = (option: string) => {
    if (!Array.isArray(currentQuestion.correctAnswer)) {
      setCurrentQuestion({
        ...currentQuestion,
        correctAnswer: [option],
      });
      return;
    }
    
    const currentAnswers = [...currentQuestion.correctAnswer];
    
    if (currentAnswers.includes(option)) {
      setCurrentQuestion({
        ...currentQuestion,
        correctAnswer: currentAnswers.filter(answer => answer !== option),
      });
    } else {
      setCurrentQuestion({
        ...currentQuestion,
        correctAnswer: [...currentAnswers, option],
      });
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.text.trim()) {
      toast({
        title: 'Question required',
        description: 'Please enter a question',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate based on question type
    if (currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'multiple-answer') {
      if (!currentQuestion.options?.every(option => option.trim())) {
        toast({
          title: 'All options required',
          description: 'Please fill in all options',
          variant: 'destructive',
        });
        return;
      }
      
      if (currentQuestion.type === 'multiple-choice' && !currentQuestion.correctAnswer) {
        toast({
          title: 'Correct answer required',
          description: 'Please select the correct answer',
          variant: 'destructive',
        });
        return;
      }
      
      if (currentQuestion.type === 'multiple-answer' && 
          (!Array.isArray(currentQuestion.correctAnswer) || currentQuestion.correctAnswer.length === 0)) {
        toast({
          title: 'Correct answers required',
          description: 'Please select at least one correct answer',
          variant: 'destructive',
        });
        return;
      }
    }
    
    // Add the question
    setQuestions([...questions, currentQuestion]);
    
    // Reset for next question
    setCurrentQuestion({
      id: crypto.randomUUID(),
      text: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: '',
    });
    
    toast({
      title: 'Question added',
      description: `Added question #${questions.length + 1}`,
    });
  };

  const handleCreateQuiz = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a quiz title',
        variant: 'destructive',
      });
      return;
    }
    
    if (questions.length === 0) {
      toast({
        title: 'Questions required',
        description: 'Please add at least one question',
        variant: 'destructive',
      });
      return;
    }
    
    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to create a quiz',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Generate a random access code
      const access_code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      console.log('Creating quiz with access code:', access_code);
      
      // Create the quiz in Supabase
      const { data: quiz, error } = await supabase.from('tests').insert({
        title,
        description,
        questions: JSON.stringify(questions),
        time_limit: parseInt(timeLimit),
        created_by: user.id,
        is_public: isPublic,
        proctoring,
        access_code
      }).select('*').single();
      
      if (error) {
        console.error('Error creating quiz:', error);
        throw error;
      }
      
      toast({
        title: 'Quiz created!',
        description: `Access code: ${quiz.access_code}`,
      });
      
      // Navigate to the tests dashboard
      navigate('/my-tests');
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to create quiz. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    toast({
      title: 'Question removed',
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Create New Quiz</CardTitle>
          <CardDescription>
            Design your quiz and share it with your students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Quiz Details</TabsTrigger>
              <TabsTrigger value="questions" disabled={!title}>
                Questions ({questions.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  placeholder="Enter quiz title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter a description for your quiz"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min="1"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-col justify-end space-y-2">
                  <Label htmlFor="isPublic">Quiz Visibility</Label>
                  <div className="flex items-center space-x-2" id="isPublic">
                    <Switch
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <span className="text-sm text-muted-foreground">
                      {isPublic ? 'Public (visible in explore)' : 'Private (access by code only)'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Proctoring Settings</h3>
                <Card className="bg-muted/20">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex flex-col gap-1.5 pb-2">
                      <div className="flex space-x-2">
                        {proctoring.fullscreen || proctoring.webcam ? (
                          <Shield className="text-quiz-blue h-4 w-4 mt-1" />
                        ) : (
                          <FileText className="text-quiz-blue h-4 w-4 mt-1" />
                        )}
                        <p className="font-medium">
                          {proctoring.fullscreen || proctoring.webcam ? 'Proctored Exam' : 'Standard Quiz'}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {proctoring.fullscreen || proctoring.webcam
                          ? 'Enforce exam integrity with proctoring features'
                          : 'No proctoring features enabled'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between space-x-2 p-3 bg-white rounded-md border">
                        <div>
                          <p className="font-medium text-sm">Require Fullscreen</p>
                          <p className="text-xs text-muted-foreground">
                            Prevents viewing other content
                          </p>
                        </div>
                        <Switch
                          checked={proctoring.fullscreen}
                          onCheckedChange={(checked) => 
                            setProctoring(prev => ({ ...prev, fullscreen: checked }))
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2 p-3 bg-white rounded-md border">
                        <div>
                          <p className="font-medium text-sm">Webcam Monitoring</p>
                          <p className="text-xs text-muted-foreground">
                            Requires camera access
                          </p>
                        </div>
                        <Switch
                          checked={proctoring.webcam}
                          onCheckedChange={(checked) => 
                            setProctoring(prev => ({ ...prev, webcam: checked }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="questions" className="space-y-6 mt-4">
              {/* Question builder */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Add a New Question</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionText">Question</Label>
                    <Textarea
                      id="questionText"
                      placeholder="Enter your question"
                      value={currentQuestion.text}
                      onChange={(e) => setCurrentQuestion({
                        ...currentQuestion,
                        text: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="questionType">Question Type</Label>
                    <Select
                      value={currentQuestion.type}
                      onValueChange={(value) => handleQuestionTypeChange(value as Question['type'])}
                    >
                      <SelectTrigger id="questionType">
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {questionTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Options based on question type */}
                  {(currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'multiple-answer') && (
                    <div className="space-y-4">
                      <Label>Options</Label>
                      {currentQuestion.options?.map((option, index) => (
                        <div className="flex items-center space-x-2" key={index}>
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(currentQuestion.options || [])];
                              newOptions[index] = e.target.value;
                              setCurrentQuestion({...currentQuestion, options: newOptions});
                            }}
                          />
                          {currentQuestion.type === 'multiple-choice' && (
                            <div className="flex items-center h-5">
                              <input
                                type="radio"
                                name="correctAnswer"
                                checked={currentQuestion.correctAnswer === option}
                                onChange={() => {
                                  setCurrentQuestion({...currentQuestion, correctAnswer: option});
                                }}
                                className="ml-2 h-4 w-4 text-quiz-blue"
                              />
                            </div>
                          )}
                          {currentQuestion.type === 'multiple-answer' && (
                            <div className="flex items-center h-5">
                              <input
                                type="checkbox"
                                checked={Array.isArray(currentQuestion.correctAnswer) && 
                                        currentQuestion.correctAnswer.includes(option)}
                                onChange={() => {
                                  if (!Array.isArray(currentQuestion.correctAnswer)) {
                                    setCurrentQuestion({...currentQuestion, correctAnswer: [option]});
                                    return;
                                  }
                                  
                                  const currentAnswers = [...currentQuestion.correctAnswer];
                                  
                                  if (currentAnswers.includes(option)) {
                                    setCurrentQuestion({
                                      ...currentQuestion,
                                      correctAnswer: currentAnswers.filter(answer => answer !== option),
                                    });
                                  } else {
                                    setCurrentQuestion({
                                      ...currentQuestion, 
                                      correctAnswer: [...currentAnswers, option],
                                    });
                                  }
                                }}
                                className="ml-2 h-4 w-4 text-quiz-blue"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                      {currentQuestion.type === 'multiple-choice' && (
                        <div className="text-sm text-muted-foreground">
                          Select the radio button next to the correct answer
                        </div>
                      )}
                      {currentQuestion.type === 'multiple-answer' && (
                        <div className="text-sm text-muted-foreground">
                          Check all options that are correct answers
                        </div>
                      )}
                    </div>
                  )}
                  
                  {currentQuestion.type === 'true-false' && (
                    <div className="space-y-4">
                      <Label>Correct Answer</Label>
                      <div className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="answerTrue"
                            name="tfAnswer"
                            checked={currentQuestion.correctAnswer === 'True'}
                            onChange={() => {
                              setCurrentQuestion({...currentQuestion, correctAnswer: 'True'});
                            }}
                            className="h-4 w-4 text-quiz-blue"
                          />
                          <Label htmlFor="answerTrue">True</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="answerFalse"
                            name="tfAnswer"
                            checked={currentQuestion.correctAnswer === 'False'}
                            onChange={() => {
                              setCurrentQuestion({...currentQuestion, correctAnswer: 'False'});
                            }}
                            className="h-4 w-4 text-quiz-blue"
                          />
                          <Label htmlFor="answerFalse">False</Label>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentQuestion.type === 'text' && (
                    <div className="space-y-2">
                      <Label htmlFor="textAnswer">Correct Answer</Label>
                      <Input
                        id="textAnswer"
                        placeholder="Enter the correct answer"
                        value={currentQuestion.correctAnswer as string || ''}
                        onChange={(e) => {
                          setCurrentQuestion({...currentQuestion, correctAnswer: e.target.value});
                        }}
                      />
                      <div className="text-sm text-muted-foreground">
                        Student responses must match this exactly (not case sensitive)
                      </div>
                    </div>
                  )}
                  
                  {currentQuestion.type === 'line-answer' && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        This question requires a longer text response. Responses will need to be manually graded.
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={addQuestion} className="bg-quiz-blue hover:bg-quiz-lightBlue">Add Question</Button>
                </CardFooter>
              </Card>
              
              {/* List of added questions */}
              {questions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Added Questions ({questions.length})</h3>
                  {questions.map((q, index) => (
                    <div 
                      key={q.id} 
                      className="p-4 border rounded-md bg-quiz-softBlue/10 relative"
                    >
                      <div className="absolute top-2 right-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeQuestion(q.id)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="font-medium">
                        Question {index + 1}: {q.type}
                      </div>
                      <div className="mt-1">{q.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/home')}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateQuiz}
            disabled={!title || questions.length === 0}
            className="bg-quiz-blue hover:bg-quiz-lightBlue"
          >
            Create Quiz
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizCreator;
