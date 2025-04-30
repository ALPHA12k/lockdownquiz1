
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ClassroomProps {
  classroom: {
    id: string;
    name: string;
    description: string;
    teacher: string;
    students: number;
    accessCode: string;
  };
}

const ClassroomCard: React.FC<ClassroomProps> = ({ classroom }) => {
  const navigate = useNavigate();
  
  return (
    <Card className="h-full flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">{classroom.name}</CardTitle>
      </CardHeader>
      <CardContent className="py-2 flex-1">
        <p className="text-muted-foreground text-sm mb-2">{classroom.description}</p>
        <div className="grid grid-cols-2 gap-1 text-sm mb-1">
          <div>Teacher:</div>
          <div className="text-right font-medium">{classroom.teacher}</div>
          <div>Students:</div>
          <div className="text-right font-medium">{classroom.students}</div>
          <div>Access Code:</div>
          <div className="text-right font-mono font-bold">{classroom.accessCode}</div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4 mt-auto">
        <div className="text-sm text-muted-foreground">
          {classroom.students} enrolled
        </div>
        <Button 
          size="sm" 
          onClick={() => navigate(`/classroom/${classroom.id}`)}
        >
          Enter
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ClassroomCard;
