import React from 'react';
import { Link } from 'react-router-dom';
import ServerCrash from 'lucide-react/dist/esm/icons/server-crash';
import Button from '../components/ui/Button'; // உங்கள் Button கூறின் பாதை

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-center p-4">
      <ServerCrash className="w-24 h-24 text-primary-500 mb-6" />
      <h1 className="text-5xl font-bold text-gray-800 dark:text-white">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mt-2 mb-6">
        Oops! The page you're looking for doesn't exist.
      </p>
      <Link to="/">
        <Button variant="primary" size="lg">
          Go Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
