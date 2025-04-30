
export interface TestSubmission {
  id: string;
  created_at: string;
  user_id: string | null;
  test_id: string;
  score: number;
  total_questions: number;
  completed: boolean;
  user_name?: string;
  user_email?: string;
  question_scores?: Record<string, number>;
}

export interface QuestionData {
  id: string;
  question_text: string;
  correct_count: number;
  incorrect_count: number;
  total_attempts: number;
  success_rate: number;
}

export interface QuestionItem {
  id: string;
  question_text: string;
  test_id: string;
}

export interface TestResultsProps {
  testId: string;
}
