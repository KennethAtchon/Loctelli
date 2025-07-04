'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { User, Client, Strategy } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ApiUsageExample() {
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example: Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Using the main API client
      const [usersData, clientsData, strategiesData] = await Promise.all([
        api.users.getUsers(),
        api.clients.getClients(),
        api.strategies.getStrategies(),
      ]);

      setUsers(usersData);
      setClients(clientsData);
      setStrategies(strategiesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Example: Create a new client
  const createNewClient = async () => {
    try {
      const newClient = await api.clients.createClient({
        userId: 1,
        strategyId: 1,
        name: 'New Client',
        email: 'newclient@example.com',
        status: 'lead',
      });

      setClients(prev => [...prev, newClient]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    }
  };

  // Example: Get clients by user
  const getClientsByUser = async (userId: number) => {
    try {
      const userClients = await api.clients.getClientsByUser(userId);
      console.log(`Clients for user ${userId}:`, userClients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user clients');
    }
  };

  // Example: Send a chat message
  const sendChatMessage = async (clientId: number, message: string) => {
    try {
      const chatMessage = await api.chat.sendMessage({
        clientId,
        message,
        strategyId: 1,
      });
      console.log('Message sent:', chatMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  // Example: Check system status
  const checkSystemStatus = async () => {
    try {
      const status = await api.status.getStatus();
      console.log('System status:', status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check status');
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Usage Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={fetchAllData} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
            <Button onClick={createNewClient} variant="outline">
              Create Client
            </Button>
            <Button onClick={() => getClientsByUser(1)} variant="outline">
              Get User Clients
            </Button>
            <Button onClick={() => sendChatMessage(1, 'Hello!')} variant="outline">
              Send Message
            </Button>
            <Button onClick={checkSystemStatus} variant="outline">
              Check Status
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Users ({users.length})</h3>
              <div className="space-y-1">
                {users.slice(0, 3).map(user => (
                  <div key={user.id} className="text-sm">
                    {user.name} - {user.email}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Clients ({clients.length})</h3>
              <div className="space-y-1">
                {clients.slice(0, 3).map(client => (
                  <div key={client.id} className="text-sm">
                    {client.name} - {client.status}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Strategies ({strategies.length})</h3>
              <div className="space-y-1">
                {strategies.slice(0, 3).map(strategy => (
                  <div key={strategy.id} className="text-sm">
                    {strategy.name} - {strategy.tag}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 