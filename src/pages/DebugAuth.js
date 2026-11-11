import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function DebugAuth() {
  const [logs, setLogs] = useState([]);
  const [session, setSession] = useState(null);

  const addLog = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, data }]);
    console.log(`[${timestamp}] ${message}`, data);
  };

  useEffect(() => {
    addLog('Component mounted');

    // Check initial session
    const checkInitialSession = async () => {
      addLog('Checking initial session...');
      const { data, error } = await supabase.auth.getSession();
      addLog('Initial session result', { session: data.session, error });
      setSession(data.session);
    };

    checkInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`Auth state changed: ${event}`, { session, user: session?.user });
      setSession(session);
    });

    return () => {
      addLog('Component unmounting');
      subscription.unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    addLog('Starting Google OAuth...');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/customer/login'
        }
      });
      addLog('OAuth initiated', { data, error });
    } catch (err) {
      addLog('OAuth error', err);
    }
  };

  const handleSignOut = async () => {
    addLog('Signing out...');
    await supabase.auth.signOut();
    setSession(null);
    localStorage.clear();
    addLog('Signed out and cleared storage');
  };

  const checkLocalStorage = () => {
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.includes('supabase') || key.includes('user')) {
        items[key] = localStorage.getItem(key);
      }
    }
    addLog('LocalStorage items', items);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Auth Debug Console</h1>

        {/* Session Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          {session ? (
            <div className="space-y-2">
              <p className="text-gray-600 font-semibold">✅ Logged In</p>
              <p><strong>User ID:</strong> {session.user.id}</p>
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>Provider:</strong> {session.user.app_metadata.provider}</p>
              <p><strong>Token expires:</strong> {new Date(session.expires_at * 1000).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-red-600 font-semibold">❌ Not Logged In</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={handleGoogleLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🔐 Login with Google
            </button>
            <button
              onClick={checkLocalStorage}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
            >
              📦 Check LocalStorage
            </button>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              🚪 Sign Out
            </button>
            <button
              onClick={() => setLogs([])}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              🗑️ Clear Logs
            </button>
          </div>
        </div>

        {/* Debug Logs */}
        <div className="bg-black text-gray-400 rounded-lg shadow p-6 font-mono text-sm">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="border-b border-gray-700 pb-2">
                  <p className="text-blue-400">[{log.timestamp}] {log.message}</p>
                  {log.data && (
                    <pre className="text-xs mt-1 text-gray-300 overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DebugAuth;
