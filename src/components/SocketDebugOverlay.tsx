 // adjust path if needed
import { getAccessToken } from '../utils/storage'; // adjust path
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import ChatSocketSingleton from '../utils/sockets/chat-socket'; // adjust path if needed


interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

const SocketDebugOverlay = ({ chatId }: { chatId: number }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState('Unknown');

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, message, type }]);
  };

  const checkStatus = () => {
    const connected = ChatSocketSingleton.isConnected();
    const instance = ChatSocketSingleton.getInstance();
    const attempts = ChatSocketSingleton.getConnectionAttempts();

    setStatus(connected ? '🟢 Connected' : '🔴 Not Connected');
    addLog(`Connected: ${connected}`, connected ? 'success' : 'error');
    addLog(`Socket ID: ${instance?.id || 'none'}`, 'info');
    addLog(`Connection attempts: ${attempts}`, 'info');
    addLog(`Transport: ${instance?.io?.engine?.transport?.name || 'none'}`, 'info');
  };

  const checkToken = async () => {
    try {
      addLog('Checking token...', 'info');
      const token = await getAccessToken();

      if (!token) {
        addLog('Token: NULL ❌ (not logged in?)', 'error');
      } else {
        addLog(`Token exists: ✅`, 'success');
        addLog(`Token preview: ${token.substring(0, 20)}...`, 'info');
        addLog(`Token length: ${token.length}`, 'info');

        // Check if it looks like a JWT
        const isJWT = token.startsWith('eyJ');
        addLog(`Looks like JWT: ${isJWT ? '✅' : '❌ (unexpected format)'}`, isJWT ? 'success' : 'error');
      }
    } catch (err: any) {
      addLog(`Token check error: ${err.message}`, 'error');
    }
  };

  const retryConnection = async () => {
    try {
      addLog('Retrying connection...', 'info');
      ChatSocketSingleton.disconnect();
      const socket = await ChatSocketSingleton.connect();

      socket.once('connect', () => {
        addLog('Retry connected! ✅', 'success');
        checkStatus();
      });

      socket.once('connect_error', (err: any) => {
        addLog(`Retry failed: ${err.message || 'Unknown error'}`, 'error');
        checkStatus();
      });

      // Re-check after 3 seconds
      setTimeout(checkStatus, 3000);
    } catch (err: any) {
      addLog(`Retry error: ${err.message}`, 'error');
    }
  };

  const clearLogs = () => setLogs([]);

  useEffect(() => {
    // Auto check on mount
    addLog('Component mounted, checking in 2s...', 'info');
    setTimeout(checkStatus, 2000);
  }, []);

  return (
    <View style={{
      position: 'absolute',
      bottom: 100,
      left: 10,
      right: 10,
      backgroundColor: 'rgba(0,0,0,0.90)',
      borderRadius: 10,
      padding: 10,
      zIndex: 9999,
      maxHeight: 320,
    }}>
      <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 4 }}>
        🔌 Socket Debug — Chat #{chatId}
      </Text>
      <Text style={{ color: 'white', marginBottom: 8 }}>Status: {status}</Text>

      {/* Buttons Row 1 */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
        <TouchableOpacity
          onPress={checkStatus}
          style={{ flex: 1, backgroundColor: '#7c3aed', padding: 8, borderRadius: 6, alignItems: 'center' }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>🔍 Check Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={checkToken}
          style={{ flex: 1, backgroundColor: '#059669', padding: 8, borderRadius: 6, alignItems: 'center' }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>🔑 Check Token</Text>
        </TouchableOpacity>
      </View>

      {/* Buttons Row 2 */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
        <TouchableOpacity
          onPress={retryConnection}
          style={{ flex: 1, backgroundColor: '#b45309', padding: 8, borderRadius: 6, alignItems: 'center' }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>🔄 Retry Connect</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={clearLogs}
          style={{ flex: 1, backgroundColor: '#374151', padding: 8, borderRadius: 6, alignItems: 'center' }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>🗑️ Clear Logs</Text>
        </TouchableOpacity>
      </View>

      {/* Logs */}
      <ScrollView style={{ maxHeight: 140 }}>
        {logs.length === 0 && (
          <Text style={{ color: '#9ca3af', fontSize: 11 }}>No logs yet...</Text>
        )}
        {logs.map((log, i) => (
          <Text
            key={i}
            style={{
              color: log.type === 'success' ? '#4ade80' : log.type === 'error' ? '#f87171' : '#e5e7eb',
              fontSize: 11,
              marginBottom: 2,
            }}
          >
            [{log.time}] {log.message}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

export default SocketDebugOverlay;