import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, Target, Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Loctelli CRM
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline your business operations with our comprehensive CRM solution. 
            Manage clients, strategies, and bookings all in one place.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/admin/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Client Management</CardTitle>
              <CardDescription>
                Organize and track all your client relationships in one place
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Target className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Sales Strategies</CardTitle>
              <CardDescription>
                Create and manage AI-powered sales strategies for better results
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Booking System</CardTitle>
              <CardDescription>
                Schedule and manage appointments with integrated calendar
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Chat Integration</CardTitle>
              <CardDescription>
                Communicate with clients through integrated messaging
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-blue-600">500+</div>
              <div className="text-gray-600">Active Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-green-600">10K+</div>
              <div className="text-gray-600">Clients Managed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-purple-600">50K+</div>
              <div className="text-gray-600">Bookings Created</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-orange-600">99%</div>
              <div className="text-gray-600">Uptime</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="text-center py-12">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Business?</h3>
            <p className="text-blue-100 mb-6">
              Join thousands of businesses already using Loctelli CRM to grow their operations.
            </p>
            <Link href="/admin/dashboard">
              <Button size="lg" variant="secondary">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
} 