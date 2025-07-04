'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, TrendingUp, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      description: 'Active users this month',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Bookings',
      value: '89',
      description: 'Meetings scheduled',
      icon: Calendar,
      color: 'text-green-600',
    },
    {
      title: 'Revenue',
      value: '$12,345',
      description: 'This month',
      icon: DollarSign,
      color: 'text-purple-600',
    },
    {
      title: 'Growth',
      value: '+12%',
      description: 'vs last month',
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Manage Clients
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              View Bookings
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <div className="text-sm">
                  <p className="font-medium">New client registered</p>
                  <p className="text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div className="text-sm">
                  <p className="font-medium">Meeting scheduled</p>
                  <p className="text-gray-500">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                <div className="text-sm">
                  <p className="font-medium">Payment received</p>
                  <p className="text-gray-500">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 