
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestSubmission, QuestionData, QuestionItem, TestResultsProps } from './types';
import { StatCards } from './StatCards';
import { SubmissionsList } from './SubmissionsList';
import { QuestionAnalysis } from './QuestionAnalysis';

export const TestResultsData: React.FC<TestResultsProps> = ({ testId }) => {
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [testTitle, setTestTitle] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchTestResults = async () => {
      setLoading(true);
      try {
        // Fetch test details
        const { data: testData, error: testError } = await supabase
          .from('tests')
          .select('title')
          .eq('id', testId)
          .single();
        
        if (testError) throw testError;
        if (testData) setTestTitle(testData.title);
        
        // Fetch submissions data
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('test_attempts')
          .select(`
            id, 
            started_at, 
            completed_at, 
            user_id, 
            guest_name, 
            test_id, 
            score, 
            answers
          `)
          .eq('test_id', testId)
          .order('started_at', { ascending: false });
        
        if (submissionsError) throw submissionsError;
        
        // Process submissions and handle user profile data separately
        const processedSubmissions: TestSubmission[] = [];
        
        for (const submission of submissionsData || []) {
          // Extract question scores from answers if available
          let questionScores: Record<string, number> = {};
          if (submission.answers && typeof submission.answers === 'object') {
            questionScores = Object.entries(submission.answers).reduce((scores, [qId, answer]) => {
              // Basic scoring logic - adjust as needed based on actual data structure
              scores[qId] = answer === true ? 1 : 0;
              return scores;
            }, {} as Record<string, number>);
          }
          
          let userName = submission.guest_name || 'Anonymous';
          let userEmail = 'Guest User'; // Default email label for guests
          
          // If there's a user_id, try to fetch the profile data
          if (submission.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, avatar')
              .eq('id', submission.user_id)
              .maybeSingle();
              
            if (profileData) {
              userName = profileData.name || userName;
              // Since we don't have email in profiles table, we'll use a placeholder
              // or you could use user_id as an identifier instead
              userEmail = `User: ${submission.user_id.substring(0, 8)}...`;
            }
          }
          
          processedSubmissions.push({
            id: submission.id,
            created_at: submission.started_at,
            user_id: submission.user_id,
            test_id: submission.test_id,
            score: submission.score || 0,
            total_questions: Object.keys(questionScores).length || 0,
            completed: submission.completed_at !== null,
            user_name: userName,
            user_email: userEmail,
            question_scores: questionScores
          });
        }
        
        setSubmissions(processedSubmissions);
        
        // Fetch questions for this test
        const { data: testDetails, error: testDetailsError } = await supabase
          .from('tests')
          .select('questions')
          .eq('id', testId)
          .single();
          
        if (testDetailsError) throw testDetailsError;
        
        // Parse questions from the test data
        let questions: QuestionItem[] = [];
        if (testDetails?.questions) {
          try {
            const parsedQuestions = typeof testDetails.questions === 'string' 
              ? JSON.parse(testDetails.questions) 
              : testDetails.questions;
            
            questions = Array.isArray(parsedQuestions) 
              ? parsedQuestions.map((q: any, index: number) => ({
                  id: q.id || `q-${index}`,
                  question_text: q.text || q.question_text || `Question ${index + 1}`,
                  test_id: testId
                }))
              : [];
          } catch (e) {
            console.error('Error parsing questions:', e);
          }
        }
        
        // Calculate question statistics
        if (questions.length > 0 && processedSubmissions.length > 0) {
          const questionStats = questions.map(question => {
            let correctCount = 0;
            let totalAttempts = 0;
            
            processedSubmissions.forEach(submission => {
              if (submission.question_scores && submission.question_scores[question.id] !== undefined) {
                totalAttempts++;
                if (submission.question_scores[question.id] > 0) {
                  correctCount++;
                }
              }
            });
            
            return {
              id: question.id,
              question_text: question.question_text || `Question ${question.id}`,
              correct_count: correctCount,
              incorrect_count: totalAttempts - correctCount,
              total_attempts: totalAttempts,
              success_rate: totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0
            };
          });
          
          setQuestionStats(questionStats);
        }
      } catch (error) {
        console.error('Error fetching test results:', error);
        toast({
          title: 'Error',
          description: 'Failed to load test results',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestResults();
  }, [testId, toast]);
  
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{testTitle || 'Test Results'}</h2>
      
      <StatCards submissions={submissions} />
      
      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="questions">Question Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="submissions" className="pt-4">
          <SubmissionsList submissions={submissions} />
        </TabsContent>
        
        <TabsContent value="questions" className="pt-4">
          <QuestionAnalysis questionStats={questionStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
