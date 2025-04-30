
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import TestList from '@/components/tests/TestList';
import TestResults from '@/components/TestResults';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { PlusCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

const MyTests = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tests, setTests] = useState<Tables<'tests'>[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [viewingResults, setViewingResults] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTests();
    }
  }, [user]);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tests',
        variant: 'destructive'
      });
    }
  };

  const handleToggleVisibility = async (testId: string, isPublic: boolean) => {
    try {
      const { error } = await supabase
        .from('tests')
        .update({ is_public: isPublic })
        .eq('id', testId);

      if (error) throw error;

      setTests(tests.map(test => 
        test.id === testId ? { ...test, is_public: isPublic } : test
      ));

      toast({
        title: 'Success',
        description: `Test visibility ${isPublic ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating test visibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update test visibility',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      const { error } = await supabase
        .from('tests')
        .delete()
        .eq('id', testId);

      if (error) throw error;

      setTests(tests.filter(test => test.id !== testId));
      toast({
        title: 'Success',
        description: 'Test deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting test:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete test',
        variant: 'destructive'
      });
    }
  };

  const handleViewResults = (testId: string) => {
    setSelectedTestId(testId);
    setViewingResults(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-quiz-blue">My Tests</h1>
          <Button 
            onClick={() => navigate('/create-quiz')}
            className="bg-quiz-blue hover:bg-quiz-lightBlue"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Test
          </Button>
        </div>
        
        <TestList 
          tests={tests}
          onToggleVisibility={handleToggleVisibility}
          onDelete={handleDelete}
          onViewResults={handleViewResults}
        />
      </main>

      <Dialog
        open={viewingResults && selectedTestId !== null}
        onOpenChange={(open) => {
          if (!open) setViewingResults(false);
        }}
      >
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Results</DialogTitle>
          </DialogHeader>
          {selectedTestId && <TestResults testId={selectedTestId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyTests;
