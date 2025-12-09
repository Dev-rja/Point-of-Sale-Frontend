import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { healthCheck, authAPI, productsAPI, salesAPI } from '../utils/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export function BackendTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const testResults: TestResult[] = [];

    // Test 1: Health Check
    testResults.push({ name: 'Backend Health', status: 'pending', message: 'Testing...' });
    setResults([...testResults]);
    
    try {
      const health = await healthCheck();
      testResults[0] = {
        name: 'Backend Health',
        status: health.status === 'ok' ? 'success' : 'error',
        message: health.status === 'ok' ? 'Backend is healthy' : 'Backend returned error'
      };
    } catch (error: any) {
      testResults[0] = {
        name: 'Backend Health',
        status: 'error',
        message: error.message
      };
    }
    setResults([...testResults]);

    // Test 2: Get Products
    testResults.push({ name: 'Fetch Products', status: 'pending', message: 'Testing...' });
    setResults([...testResults]);
    
    try {
      const products = await productsAPI.getAll();
      testResults[1] = {
        name: 'Fetch Products',
        status: 'success',
        message: `Found ${products.length} products`
      };
    } catch (error: any) {
      testResults[1] = {
        name: 'Fetch Products',
        status: 'error',
        message: error.message
      };
    }
    setResults([...testResults]);

    // Test 3: Login Test
    testResults.push({ name: 'Authentication', status: 'pending', message: 'Testing...' });
    setResults([...testResults]);
    
    try {
      const result = await authAPI.login('admin', 'admin123');
      testResults[2] = {
        name: 'Authentication',
        status: 'success',
        message: `Logged in as ${result.user.name}`
      };

      // Test 4: Get Sales (requires auth)
      testResults.push({ name: 'Fetch Sales', status: 'pending', message: 'Testing...' });
      setResults([...testResults]);
      
      try {
        const sales = await salesAPI.getAll();
        testResults[3] = {
          name: 'Fetch Sales',
          status: 'success',
          message: `Found ${sales.length} sales`
        };
      } catch (error: any) {
        testResults[3] = {
          name: 'Fetch Sales',
          status: 'error',
          message: error.message
        };
      }
    } catch (error: any) {
      testResults[2] = {
        name: 'Authentication',
        status: 'error',
        message: error.message
      };
      testResults.push({
        name: 'Fetch Sales',
        status: 'error',
        message: 'Skipped due to auth failure'
      });
    }

    setResults([...testResults]);
    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Loader className="size-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="size-4 text-green-500" />;
      case 'error':
        return <XCircle className="size-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <Card className="w-80 shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm">Backend Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={runTests} 
            disabled={testing}
            className="w-full bg-[#4a9d5f] hover:bg-[#3d8450]"
            size="sm"
          >
            {testing ? 'Testing...' : 'Run Tests'}
          </Button>

          {results.length > 0 && (
            <div className="space-y-2 mt-4">
              {results.map((result, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <p className="text-gray-900">{result.name}</p>
                    <p className="text-gray-600 text-xs">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
