"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Zap,
  BarChart3,
  Calendar,
  MessageSquare,
  Users,
  Globe,
  Lock,
  RefreshCw,
} from "lucide-react";

export function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-teal-500" />,
      title: "AI-Powered Targeting",
      description:
        "Our AI analyzes market data to identify and target your ideal prospects with precision.",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-teal-500" />,
      title: "Advanced Analytics",
      description:
        "Gain deep insights into your lead generation performance with real-time dashboards.",
    },
    {
      icon: <Calendar className="w-6 h-6 text-teal-500" />,
      title: "Automated Scheduling",
      description:
        "Qualified leads are automatically booked into your calendar, eliminating manual work.",
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-teal-500" />,
      title: "24/7 Lead Qualification",
      description:
        "Our AI chatbot engages with leads around the clock, qualifying them based on your criteria.",
    },
    {
      icon: <Users className="w-6 h-6 text-teal-500" />,
      title: "Team Collaboration",
      description:
        "Seamlessly share leads and insights with your team members for better coordination.",
    },
    {
      icon: <Globe className="w-6 h-6 text-teal-500" />,
      title: "Multi-Channel Integration",
      description:
        "Connect with leads across various platforms including social media, email, and web.",
    },
    {
      icon: <Lock className="w-6 h-6 text-teal-500" />,
      title: "Enterprise-Grade Security",
      description:
        "Your data is protected with advanced encryption and security protocols.",
    },
    {
      icon: <RefreshCw className="w-6 h-6 text-teal-500" />,
      title: "Continuous Optimization",
      description:
        "Our AI continuously learns and improves targeting based on performance data.",
    },
  ];

  return (
    <section id="features" className="py-24 bg-white" ref={ref}>
      <div className="container">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            Powerful Features
          </motion.h2>
          <motion.div
            className="w-20 h-1 bg-teal-500 mx-auto mb-6"
            initial={{ opacity: 0, width: 0 }}
            animate={
              isInView ? { opacity: 1, width: 80 } : { opacity: 0, width: 0 }
            }
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <motion.p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Everything you need to supercharge your lead generation and
            conversion
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <div className="bg-teal-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
