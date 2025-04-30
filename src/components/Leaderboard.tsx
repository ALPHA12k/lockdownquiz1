
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface LeaderboardProps {
  data: Array<{
    id: string;
    name: string;
    score: number;
    quizzes: number;
  }>;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ data }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Rank</TableHead>
            <TableHead>Student</TableHead>
            <TableHead className="text-right">Avg. Score</TableHead>
            <TableHead className="text-right">Quizzes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((user, index) => (
            <TableRow key={user.id} className={index < 3 ? 'bg-quiz-softBlue/30' : ''}>
              <TableCell className="font-medium">#{index + 1}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className={index < 3 ? 'bg-quiz-blue text-white' : ''}>
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">{user.score}%</TableCell>
              <TableCell className="text-right">{user.quizzes}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Leaderboard;
