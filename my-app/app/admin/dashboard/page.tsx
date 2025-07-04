import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Target,
  Calendar,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

// Mock data - replace with real API calls
const stats = [
  {
    title: 'Total Users',
    value: '1,234',
    change: '+12%',
    trend: 'up',
    icon: Users,
    color: 'text-blue-600',
  },
  {
    title: 'Active Clients',
    value: '856',
    change: '+8%',
    trend: 'up',
    icon: Users,
    color: 'text-green-600',
  },
  {
    title: 'Strategies',
    value: '45',
    change: '+5%',
    trend: 'up',
    icon: Target,
    color: 'text-purple-600',
  },
  {
    title: 'Bookings',
    value: '2,341',
    change: '-3%',
    trend: 'down',
    icon: Calendar,
    color: 'text-orange-600',
  },
];

const recentBookings = [
  {
    id: 1,
    client: 'John Doe',
    type: 'Consultation',
    date: '2024-01-15',
    status: 'confirmed',
  },
  {
    id: 2,
    client: 'Jane Smith',
    type: 'Follow-up',
    date: '2024-01-16',
    status: 'pending',
  },
  {
    id: 3,
    client: 'Mike Johnson',
    type: 'Sales Call',
    date: '2024-01-17',
    status: 'confirmed',
  },
];

const recentClients = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    lastContact: '2024-01-15',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'lead',
    lastContact: '2024-01-14',
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike@example.com',
    status: 'active',
    lastContact: '2024-01-13',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
        </div>
        <Button>
          View Reports
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-gray-600">
                {stat.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                {stat.change} from last month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest appointments and meetings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{booking.client}</p>
                    <p className="text-sm text-gray-600">{booking.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{booking.date}</p>
                    <Badge
                      variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/admin/bookings">
                <Button variant="outline" size="sm" className="w-full">
                  View All Bookings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Clients</CardTitle>
            <CardDescription>Latest client additions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-gray-600">{client.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{client.lastContact}</p>
                    <Badge
                      variant={client.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {client.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/admin/clients">
                <Button variant="outline" size="sm" className="w-full">
                  View All Clients
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/clients/new">
              <Button variant="outline" className="w-full h-20 flex-col">
                <Users className="h-6 w-6 mb-2" />
                Add Client
              </Button>
            </Link>
            <Link href="/admin/strategies/new">
              <Button variant="outline" className="w-full h-20 flex-col">
                <Target className="h-6 w-6 mb-2" />
                Create Strategy
              </Button>
            </Link>
            <Link href="/admin/bookings/new">
              <Button variant="outline" className="w-full h-20 flex-col">
                <Calendar className="h-6 w-6 mb-2" />
                Schedule Booking
              </Button>
            </Link>
            <Link href="/admin/chat">
              <Button variant="outline" className="w-full h-20 flex-col">
                <MessageSquare className="h-6 w-6 mb-2" />
                View Messages
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 