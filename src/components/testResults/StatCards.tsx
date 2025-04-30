
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestSubmission } from './types';

interface StatCardsProps {
  submissions: TestSubmission[];
}

export const StatCards: React.FC<StatCardsProps> = ({ submissions }) => {
  const calculateAverageScore = () => {
    if (submissions.length === 0) return 0;
    const totalScore = submissions.reduce((sum, submission) => sum + submission.score, 0);
    return totalScore / submissions.length;
  };
  
  const calculateCompletionRate = () => {
    if (submissions.length === 0) return 0;
    const completedCount = submissions.filter(submission => submission.completed).length;
    return (completedCount / submissions.length) * 100;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{submissions.length}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{calculateAverageScore().toFixed(1)}%</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{calculateCompletionRate().toFixed(1)}%</div>
        </CardContent>
      </Card>
    </div>
  );
};
