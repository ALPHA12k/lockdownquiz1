
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, FileText, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface QuizProps {
  quiz: {
    id: string;
    title: string;
    description: string;
    questions: number;
    timeLimit: number;
    creator: string;
    createdAt: string;
    accessCode: string;
    proctored?: boolean;
  };
}

const QuizCard: React.FC<QuizProps> = ({ quiz }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const copyAccessCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast({
      title: 'Access code copied!',
      description: 'The access code has been copied to your clipboard.',
    });
  };
  
  return (
    <Card className="h-full flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-1">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold">{quiz.title}</CardTitle>
          {quiz.proctored && (
            <Badge variant="outline" className="bg-quiz-softPeach">
              <Shield className="mr-1 h-3 w-3" /> Proctored
            </Badge>
          )}
          {!quiz.proctored && (
            <Badge variant="outline" className="bg-quiz-softBlue/20 text-quiz-blue">
              <FileText className="mr-1 h-3 w-3" /> Quiz
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="py-2 flex-1">
        <p className="text-muted-foreground text-sm mb-2">{quiz.description}</p>
        <div className="grid grid-cols-2 gap-1 text-sm mb-3">
          <div>Questions:</div>
          <div className="text-right font-medium">{quiz.questions}</div>
          <div>Time Limit:</div>
          <div className="text-right font-medium">{quiz.timeLimit} min</div>
        </div>
        <div className="flex items-center justify-between text-sm bg-muted/40 rounded-md p-2">
          <div className="font-mono font-medium">{quiz.accessCode}</div>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-7 w-7"
            onClick={(e) => copyAccessCode(e, quiz.accessCode)}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4 mt-auto">
        <div className="text-xs text-muted-foreground">
          {new Date(quiz.createdAt).toLocaleDateString()}
        </div>
        <Button 
          size="sm" 
          onClick={() => navigate(`/take-quiz/${quiz.id}`)}
          className="bg-quiz-blue hover:bg-quiz-lightBlue"
        >
          Start
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizCard;
