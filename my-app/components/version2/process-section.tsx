"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Star,
  Bot,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle2,
  Users,
  MessageSquare,
  Target,
} from "lucide-react";
import { useState } from "react";

export function ProcessSection() {
  const [activeProcess, setActiveProcess] = useState(0);

  const processes = [
    {
      id: 0,
      title: "Free Website Process",
      icon: Globe,
      color: "blue",
      subtitle: "From mockup to live website in 7 days",
      steps: [
        {
          title: "Book Discovery Call",
          description:
            "Schedule a 30-minute consultation to discuss your business needs and website vision.",
          duration: "30 min",
        },
        {
          title: "Mockup Presentation",
          description:
            "We create and show you a custom mockup of exactly what your website will look like.",
          duration: "Day 2-3",
        },
        {
          title: "Content Collection",
          description:
            "You approve the design and fill out our simple form with your business information.",
          duration: "Day 4",
        },
        {
          title: "Launch & Handover",
          description:
            "Final review call where we launch your website and train you on how to manage it.",
          duration: "Day 7",
        },
      ],
    },
    {
      id: 1,
      title: "Google Reviews Process",
      icon: Star,
      color: "purple",
      subtitle: "Automated 4-5 star review generation",
      steps: [
        {
          title: "Customer List Setup",
          description:
            "You provide your past customer database and we import it into our system.",
          duration: "Day 1",
        },
        {
          title: "SMS Campaign Launch",
          description:
            "Automated text messages sent to customers asking for reviews with a custom link.",
          duration: "Day 2",
        },
        {
          title: "Smart Review Filtering",
          description:
            "3+ stars → Google Reviews. Under 3 stars → Private feedback form (not public).",
          duration: "Automatic",
        },
        {
          title: "Ongoing Optimization",
          description:
            "Continuous monitoring, follow-ups, and campaign refinement for maximum results.",
          duration: "Monthly",
        },
      ],
    },
    {
      id: 2,
      title: "AI Lead Generation Process",
      icon: Bot,
      color: "green",
      subtitle: "Lisa AI qualifies and books qualified leads 24/7",
      steps: [
        {
          title: "Targeted Ad Setup",
          description:
            "Facebook ads launched targeting your specific areas, zip codes, and ideal customers.",
          duration: "Day 1-2",
        },
        {
          title: "Lead Capture Forms",
          description:
            "Interested prospects click ads and fill out forms with name, number, and email.",
          duration: "Real-time",
        },
        {
          title: "Lisa AI Qualification",
          description:
            "Our AI bot texts leads like a human, asks qualifying questions about their needs.",
          duration: "Instant",
        },
        {
          title: "Calendar Booking",
          description:
            "Qualified leads automatically scheduled for in-person estimates on your calendar.",
          duration: "24/7",
        },
      ],
    },
  ];

  const colorMap: Record<
    string,
    {
      bg: string;
      border: string;
      icon: string;
      text: string;
      accent: string;
      button: string;
    }
  > = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "bg-blue-500",
      text: "text-blue-600",
      accent: "bg-blue-100",
      button: "bg-blue-500 hover:bg-blue-600",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: "bg-purple-500",
      text: "text-purple-600",
      accent: "bg-purple-100",
      button: "bg-purple-500 hover:bg-purple-600",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: "bg-green-500",
      text: "text-green-600",
      accent: "bg-green-100",
      button: "bg-green-500 hover:bg-green-600",
    },
  };

  const currentProcess = processes[activeProcess];
  const colors = colorMap[currentProcess.color] || colorMap.blue;

  return (
    <>
      <style jsx>{`
        @keyframes wiggle {
          0%,
          7% {
            transform: rotateZ(0);
          }
          15% {
            transform: rotateZ(-1deg);
          }
          20% {
            transform: rotateZ(1deg);
          }
          25% {
            transform: rotateZ(-1deg);
          }
          30% {
            transform: rotateZ(1deg);
          }
          35% {
            transform: rotateZ(-1deg);
          }
          40%,
          100% {
            transform: rotateZ(0);
          }
        }
      `}</style>
      <section
        id="process"
        className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200 mb-6">
              <Target className="w-4 h-4 mr-2" />
              How Each Service Works
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Proven
              <span className="block text-blue-600">Service Processes</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Each service has its own streamlined process designed for maximum
              results. Choose a service below to see exactly how we deliver.
            </p>
          </div>

          {/* Service Selector */}
          <div className="flex flex-col md:flex-row gap-4 mb-12 justify-center">
            {processes.map((process, index) => {
              const isActive = activeProcess === index;
              const btnColors = colorMap[process.color] || colorMap.blue;
              return (
                <Button
                  key={index}
                  onClick={() => setActiveProcess(index)}
                  variant={isActive ? "default" : "outline"}
                  className={`${
                    isActive
                      ? `${btnColors.button} text-white shadow-lg`
                      : `border-3 ${btnColors.border} ${btnColors.text} hover:${btnColors.bg} hover:scale-105 animate-pulse shadow-md hover:shadow-lg`
                  } px-8 py-4 rounded-full transition-all duration-300 cursor-pointer transform hover:scale-110 ${!isActive ? "hover:animate-bounce" : ""}`}
                  style={{
                    animation: !isActive
                      ? "wiggle 2s ease-in-out infinite"
                      : "none",
                  }}
                >
                  <process.icon className="w-5 h-5 mr-2" />
                  {process.title}
                </Button>
              );
            })}
          </div>

          {/* Active Process Display */}
          <div className="mb-16">
            <Card className={`${colors.bg} ${colors.border} border-2`}>
              <CardHeader className="text-center pb-6">
                <div
                  className={`w-20 h-20 ${colors.icon} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                >
                  <currentProcess.icon className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  {currentProcess.title}
                </CardTitle>
                <p className="text-lg text-gray-600 font-medium">
                  {currentProcess.subtitle}
                </p>
              </CardHeader>

              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {currentProcess.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="relative">
                      {/* Connection Line */}
                      {stepIndex < currentProcess.steps.length - 1 && (
                        <div className="hidden lg:block absolute top-8 left-full w-6 h-0.5 bg-gray-300 z-10"></div>
                      )}

                      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300 group h-full">
                        {/* Step Number */}
                        <div
                          className={`w-8 h-8 ${colors.icon} rounded-full text-white text-sm font-bold flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                        >
                          {stepIndex + 1}
                        </div>

                        {/* Duration Badge */}
                        <div
                          className={`inline-block px-3 py-1 ${colors.accent} ${colors.text} text-xs font-semibold rounded-full mb-3`}
                        >
                          {step.duration}
                        </div>

                        {/* Step Content */}
                        <h4 className="font-bold text-gray-900 mb-3 text-lg">
                          {step.title}
                        </h4>
                        <p className="text-gray-600 leading-relaxed text-sm">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Benefits */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Fast Setup
              </h3>
              <p className="text-gray-600">
                All services launched within 7 days or less
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Proven Results
              </h3>
              <p className="text-gray-600">
                100% satisfaction rate with all 10+ clients
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                24/7 Support
              </h3>
              <p className="text-gray-600">
                Ongoing optimization and support included
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white max-w-2xl mx-auto">
              <CardContent className="p-8">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-90" />
                <h3 className="text-2xl font-bold mb-3">
                  Ready to Get Started?
                </h3>
                <p className="text-blue-100 mb-6 text-lg">
                  Choose one service or get all three. Book a free consultation
                  to discuss which process fits your business best.
                </p>
                <Button
                  onClick={() =>
                    open("https://calendly.com/loctelli-info/45min")
                  }
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Free Consultation
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <div className="mt-4 text-blue-200 text-sm">
                  <Clock className="w-4 h-4 inline mr-1" />
                  30-minute call • No pressure • Free strategy session
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
