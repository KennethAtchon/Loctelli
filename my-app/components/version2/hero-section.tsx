"use client";

import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section id="home" className="relative py-16 px-4 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-25 to-purple-25"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-16 left-8 w-12 h-12 bg-blue-200 rounded-full opacity-20 animate-bounce"></div>
      <div className="absolute top-32 right-16 w-10 h-10 bg-purple-200 rounded-full opacity-20 animate-bounce delay-200"></div>

      <div className="relative max-w-6xl mx-auto">
        {/* Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200">
            <Sparkles className="w-3 h-3 mr-2" />
            #1 AI Marketing Solution
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Transform Your Business with
            <span className="block text-blue-600">
              AI-Powered Marketing
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            We help businesses <span className="font-semibold text-gray-800">triple their revenue</span> with free professional websites, automated Google reviews, customer reactivation campaigns, and AI-driven lead generation.
          </p>


          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button 
              onClick={() => open("https://calendly.com/loctelli-info/30min")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Free Consultation
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}