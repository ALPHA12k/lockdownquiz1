
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QuestionData } from './types';

interface QuestionAnalysisProps {
  questionStats: QuestionData[];
}

export const QuestionAnalysis: React.FC<QuestionAnalysisProps> = ({ questionStats }) => {
  return (
    <>
      {questionStats.length > 0 ? (
        <div className="space-y-8">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={questionStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="id" />
                <YAxis label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Success Rate']} 
                />
                <Bar dataKey="success_rate" fill="#8884d8" name="Success Rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Correct</TableHead>
                <TableHead>Incorrect</TableHead>
                <TableHead>Success Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionStats.map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="max-w-xs truncate">
                    {question.question_text}
                  </TableCell>
                  <TableCell>{question.correct_count}</TableCell>
                  <TableCell>{question.incorrect_count}</TableCell>
                  <TableCell>
                    {question.success_rate.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-center py-8 text-muted-foreground">No question data available</p>
      )}
    </>
  );
};
