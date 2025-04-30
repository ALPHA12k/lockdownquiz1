
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type EmptyStateProps = {
  searchQuery?: string;
};

export const EmptyState = ({ searchQuery }: EmptyStateProps) => {
  return (
    <Card className="bg-muted/40">
      <CardContent className="pt-6 text-center">
        <p className="text-muted-foreground">
          {searchQuery ? "No tests match your search" : "You haven't created any tests yet"}
        </p>
        {!searchQuery && (
          <Button 
            className="mt-4 bg-quiz-blue hover:bg-quiz-lightBlue"
            onClick={() => window.location.href = '/create-quiz'}
          >
            Create Your First Test
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
