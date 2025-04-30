
import React from 'react';
import { TestResultsData } from './testResults/TestResultsData';

interface TestResultsProps {
  testId: string;
}

const TestResults: React.FC<TestResultsProps> = ({ testId }) => {
  return <TestResultsData testId={testId} />;
};

export default TestResults;
