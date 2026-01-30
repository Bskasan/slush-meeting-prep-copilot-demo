import { useEffect, useState } from 'react';
import { checkHealth } from './services/api';

function App() {
  const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading');

  useEffect(() => {
    checkHealth()
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
        Meeting Prep Copilot
      </h1>
      
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="flex items-center space-x-3">
          <div className={`h-3 w-3 rounded-full animate-pulse ${
            status === 'online' ? 'bg-green-500' : status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
          }`} />
          <span className="capitalize font-mono text-sm">
            Backend & Database: {status}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;