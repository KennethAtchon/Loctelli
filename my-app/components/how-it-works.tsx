"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  MonitorSmartphone,
  Users,
  MessageSquareText,
  Calendar,
} from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Ad Creation",
    description:
      "We create targeted ads that reach your ideal customers across multiple platforms.",
    icon: MonitorSmartphone,
    color: "from-blue-500 to-blue-600",
  },
  {
    id: 2,
    title: "Lead Funneling",
    description:
      "Interested prospects are automatically funneled into our AI-powered system.",
    icon: Users,
    color: "from-indigo-500 to-indigo-600",
  },
  {
    id: 3,
    title: "AI Chat Qualification",
    description:
      "Our AI engages with leads 24/7, qualifying them based on your specific criteria.",
    icon: MessageSquareText,
    color: "from-violet-500 to-violet-600",
  },
  {
    id: 4,
    title: "Meeting Booking",
    description:
      "Qualified leads are automatically scheduled into your calendar for follow-up.",
    icon: Calendar,
    color: "from-purple-500 to-purple-600",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      id="how-it-works"
      className="py-24 bg-gray-900 relative overflow-hidden"
      ref={ref}
    >
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600 opacity-30"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-blue-500 opacity-30"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            How It{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Works
            </span>
          </motion.h2>
          <motion.p
            className="text-xl text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Our seamless four-step process automates your entire lead generation
            and qualification workflow
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className="bg-gray-800 rounded-xl p-6 relative overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-50 group-hover:opacity-0 transition-opacity duration-300"></div>
              <div
                className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              ></div>

              <div className="relative z-10">
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}
                >
                  <step.icon className="w-6 h-6 text-white" />
                </div>

                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3 font-bold text-sm">
                    {step.id}
                  </div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                </div>

                <p className="text-gray-400">{step.description}</p>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 transform -translate-y-1/2 z-20">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 12H19M19 12L12 5M19 12L12 19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-blue-500"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
