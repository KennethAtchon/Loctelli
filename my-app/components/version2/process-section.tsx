"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Star, Bot, CheckCircle, ArrowRight, Clock, Sparkles } from "lucide-react";

export function ProcessSection() {
  const processes = [
    {
      icon: Globe,
      title: "Website Development",
      subtitle: "From concept to launch in 7 days",
      gradient: "blue-500",
      bgGradient: "blue-25",
      steps: [
        { title: "Discovery Call", description: "Book a 30-minute strategy session with our team", duration: "Day 1" },
        { title: "Design Mockup", description: "We create and present your website mockup", duration: "Day 2-3" },
        { title: "Content Gathering", description: "You approve design and provide content via our form", duration: "Day 4" },
        { title: "Launch & Training", description: "Final review call, launch, and handover training", duration: "Day 7" }
      ]
    },
    {
      icon: Star,
      title: "Google Reviews",
      subtitle: "Automated reputation management",
      gradient: "blue-500",
      bgGradient: "blue-25",
      steps: [
        { title: "Customer List Setup", description: "You provide your past customer database", duration: "Day 1" },
        { title: "Campaign Launch", description: "Automated review requests sent via SMS", duration: "Day 2" },
        { title: "Smart Filtering", description: "5-star reviews → Google, low ratings → private feedback", duration: "Ongoing" },
        { title: "Optimization", description: "Continuous monitoring and campaign refinement", duration: "Ongoing" }
      ]
    },
    {
      icon: Bot,
      title: "AI Lead Generation",
      subtitle: "Lisa AI works 24/7 for your business",
      gradient: "blue-500",
      bgGradient: "blue-25",
      steps: [
        { title: "Ad Campaign Setup", description: "Targeted Facebook ads launch in your service area", duration: "Day 1-2" },
        { title: "Lead Capture", description: "Prospects fill out interest forms from your ads", duration: "Ongoing" },
        { title: "Lisa AI Qualification", description: "AI bot texts leads, qualifies needs and budget", duration: "Real-time" },
        { title: "Calendar Booking", description: "Qualified leads automatically booked for estimates", duration: "24/7" }
      ]
    }
  ];

  return (
    <section id="process" className="py-16 px-4 bg-gray-25 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/3 w-48 h-48 bg-purple-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-semibold border border-purple-200 mb-4">
            <Clock className="w-3 h-3 mr-2" />
            Proven Process
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            How We Deliver
            <span className="block text-purple-600">
              Guaranteed Results
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our streamlined process ensures fast implementation and measurable results. Here's exactly what happens when you work with us.
          </p>
        </div>

        {/* Process Cards */}
        <div className="space-y-8">
          {processes.map((process, index) => (
            <div key={index} className="relative">
              {/* Process Number */}
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-lg font-bold mx-auto mb-6 shadow-lg">
                {index + 1}
              </div>
              
              <Card className={`relative overflow-hidden bg-${process.bgGradient} border-2 border-gray-200 hover:shadow-lg transition-all duration-300 group`}>
                {/* Header */}
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-${process.gradient} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <process.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{process.title}</CardTitle>
                  <p className="text-gray-600 font-medium">{process.subtitle}</p>
                </CardHeader>

                {/* Steps Timeline */}
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {process.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="relative">
                        {/* Timeline Connector (except last item) */}
                        {stepIndex < process.steps.length - 1 && (
                          <div className={`hidden lg:block absolute top-6 left-full w-4 h-0.5 bg-${process.gradient} opacity-20`}></div>
                        )}
                        
                        <div className="relative z-10 bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-300 group/step">
                          {/* Step Number */}
                          <div className={`w-6 h-6 rounded-full bg-${process.gradient} text-white text-xs font-bold flex items-center justify-center mb-3`}>
                            {stepIndex + 1}
                          </div>
                          
                          {/* Duration Badge */}
                          <div className={`inline-block px-2 py-1 rounded-full bg-${process.gradient} text-white text-xs font-semibold mb-2`}>
                            {step.duration}
                          </div>
                          
                          {/* Step Content */}
                          <h4 className="font-bold text-gray-900 mb-2 text-sm group-hover/step:text-purple-600 transition-colors">
                            {step.title}
                          </h4>
                          <p className="text-gray-600 text-xs leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Arrow to Next Process */}
              {index < processes.length - 1 && (
                <div className="flex justify-center my-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-b from-gray-200 to-gray-300 flex items-center justify-center shadow-md">
                    <ArrowRight className="w-4 h-4 text-gray-600 rotate-90" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-2xl font-bold mb-3">Ready to Get Started?</h3>
            <p className="text-blue-100 mb-4 max-w-xl mx-auto">
              Our proven process has helped 10+ businesses transform their marketing. Your success story starts with one call.
            </p>
            <div className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold shadow-lg inline-flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Results in 30 Days or Less
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}