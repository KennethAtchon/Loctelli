"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Star, Users, TrendingUp, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ServicesSection() {
  const services = [
    {
      icon: Globe,
      title: "Free Professional Websites",
      description: "Complete websites at zero cost",
      gradient: "blue-500",
      bgGradient: "blue-25",
      borderColor: "border-blue-200",
      features: ["Mobile-responsive design", "SEO optimized", "Lightning fast loading", "Custom from scratch"],
      value: "$2,500 Value - FREE"
    },
    {
      icon: Star,
      title: "Smart Review System",
      description: "Only 4-5 star reviews reach Google",
      gradient: "blue-500",
      bgGradient: "blue-25",
      borderColor: "border-blue-200",
      features: ["Automated review requests", "Smart filtering system", "Negative review protection", "Reputation management"],
      value: "Boost ratings 2-3x"
    },
    {
      icon: Users,
      title: "Customer Reactivation",
      description: "AI-powered win-back campaigns",
      gradient: "blue-500",
      bgGradient: "blue-25",
      borderColor: "border-blue-200",
      features: ["Past customer outreach", "Cold lead nurturing", "Personalized discounts", "Automated booking"],
      value: "30% conversion rate"
    },
    {
      icon: TrendingUp,
      title: "AI Lead Generation",
      description: "Lisa AI qualifies and books leads",
      gradient: "blue-500",
      bgGradient: "blue-25",
      borderColor: "border-blue-200",
      features: ["Targeted Facebook ads", "AI qualification bot", "Calendar integration", "Human-like conversations"],
      value: "5x more qualified leads"
    }
  ];

  return (
    <section id="services" className="py-16 px-4 bg-gray-25 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200 mb-4">
            <Sparkles className="w-3 h-3 mr-2" />
            Complete Marketing Suite
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            Everything Your Business
            <span className="block text-blue-600">
              Needs to Dominate
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our comprehensive AI-powered suite handles every aspect of your marketing, from building your online presence to booking qualified appointments.
          </p>
        </div>
        
        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className={`group relative overflow-hidden bg-${service.bgGradient} border-2 ${service.borderColor} hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer`}
            >
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              
              <CardHeader className="relative z-10 pb-3">
                <div className={`w-12 h-12 rounded-xl bg-${service.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">{service.title}</CardTitle>
                <CardDescription className="text-gray-600">{service.description}</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ul className="space-y-2 mb-4">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-700 text-sm">
                      <CheckCircle className="w-4 h-4 text-purple-600 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white hover:border-blue-500 group/btn transition-all duration-300"
                >
                  Learn More 
                  <ArrowRight className="w-3 h-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="bg-blue-600 rounded-xl p-6 text-white">
            <h3 className="text-2xl font-bold mb-3">Ready to Get All Four Services?</h3>
            <p className="text-blue-100 mb-4">Book a call to see how we can transform your business with our complete marketing suite.</p>
            <Button 
              onClick={() => open("https://calendly.com/loctelli-info/30min")}
              className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Schedule Your Strategy Call
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}