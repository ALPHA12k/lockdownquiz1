
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Eye, Trash2, LineChart } from 'lucide-react';
import { getQuestionCount } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

export interface TestCardProps {
  test: Tables<'tests'>;
  onToggleVisibility: (testId: string, isPublic: boolean) => Promise<void>;
  onDelete: (testId: string) => Promise<void>;
  onViewResults?: (testId: string) => void;
}

const TestCard: React.FC<TestCardProps> = ({ 
  test, 
  onToggleVisibility, 
  onDelete,
  onViewResults
}) => {
  // Use the helper function to get question count
  const questionsCount = getQuestionCount(test.questions);

  return (
    <TableRow>
      <TableCell className="font-medium">{test.title}</TableCell>
      <TableCell>{questionsCount} questions</TableCell>
      <TableCell>{test.access_code}</TableCell>
      <TableCell>
        <Switch
          checked={test.is_public}
          onCheckedChange={(checked) => onToggleVisibility(test.id, checked)}
        />
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = `/take-quiz/${test.id}`}
            title="Preview Test"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          {onViewResults && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewResults(test.id)}
              title="View Results"
            >
              <LineChart className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(test.id)}
            title="Delete Test"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default TestCard;
