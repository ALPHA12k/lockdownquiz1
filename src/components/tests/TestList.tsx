
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TestCard from './TestCard';
import type { Tables } from '@/types/supabase';

export interface TestListProps {
  tests: Tables<'tests'>[];
  onToggleVisibility: (testId: string, isPublic: boolean) => Promise<void>;
  onDelete: (testId: string) => Promise<void>;
  onViewResults?: (testId: string) => void;
}

export const TestList: React.FC<TestListProps> = ({ 
  tests, 
  onToggleVisibility, 
  onDelete,
  onViewResults 
}) => {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Test</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Access Code</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead className="w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              onToggleVisibility={onToggleVisibility}
              onDelete={onDelete}
              onViewResults={onViewResults}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TestList;
