
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TestSubmission } from './types';

interface SubmissionsListProps {
  submissions: TestSubmission[];
}

export const SubmissionsList: React.FC<SubmissionsListProps> = ({ submissions }) => {
  return (
    <>
      {submissions.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell>
                  <div>{submission.user_name}</div>
                  <div className="text-sm text-muted-foreground">{submission.user_email}</div>
                </TableCell>
                <TableCell>
                  {new Date(submission.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {submission.score}%
                </TableCell>
                <TableCell>
                  {submission.completed ? 
                    <span className="text-green-600">Completed</span> : 
                    <span className="text-amber-600">Incomplete</span>
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center py-8 text-muted-foreground">No submissions yet</p>
      )}
    </>
  );
};
