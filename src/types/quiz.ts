
export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'text' | 'multiple-answer' | 'line-answer';
  options?: string[];
  correctAnswer?: string | string[];
}

export interface QuizData {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
  time_limit: number;
  access_code: string;
  created_by: string;
  is_public: boolean;
  proctoring: {
    fullscreen?: boolean;
    webcam?: boolean;
  } | null;
}

export interface QuizAttempt {
  id: string;
  test_id: string;
  user_id?: string;
  guest_name?: string;
  started_at: string;
  completed_at?: string;
  answers?: Record<string, any>;
  score?: number;
  question_scores?: Record<string, number>;
}

export interface UserProfile {
  id: string;
  name?: string;
  avatar?: string | null;
}
