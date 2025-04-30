
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { Home, FileText, Settings, User, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast({
        title: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error logging out",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        <Link to="/home" className="flex items-center space-x-2">
          <span className="font-bold text-xl text-quiz-blue">LockDownQuiz</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/home" className="flex items-center space-x-1 text-gray-600 hover:text-quiz-blue">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link to="/my-tests" className="flex items-center space-x-1 text-gray-600 hover:text-quiz-blue">
            <FileText className="h-4 w-4" />
            <span>My Tests</span>
          </Link>
          <Link to="/settings" className="flex items-center space-x-1 text-gray-600 hover:text-quiz-blue">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
          <Link to="/profile" className="flex items-center space-x-1 text-gray-600 hover:text-quiz-blue">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            {user && (
              <div className="text-sm text-gray-600">
                {user.email}
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout} 
            className="flex items-center space-x-1"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
