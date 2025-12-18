"use client";

import { useRef } from "react";
import { Monitor, MessageSquare, Calendar, ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      number: 1,
      title: "Campaigns Creation",
      description:
        "We create authoritative online campaigns to generate leads in the zip codes and areas you want.",
      icon: <Monitor className="w-6 h-6 text-white" />,
      iconBg: "bg-blue-500",
    },
    {
      number: 2,
      title: "AI Chat Qualification",
      description:
        "We qualify the leads based on your specifications to ensure they are quote-ready.",
      icon: <MessageSquare className="w-6 h-6 text-white" />,
      iconBg: "bg-purple-500",
    },
    {
      number: 3,
      title: "Meeting Booking",
      description:
        "Our trained AI employee engages them in conversation and books appointments directly into your calendar.",
      icon: <Calendar className="w-6 h-6 text-white" />,
      iconBg: "bg-purple-600",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-gray-50" ref={ref}>
      <div className="container">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            How It <span className="text-blue-500">Works</span>
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
            className="text-lg text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Our seamless three-step process automates your entire lead
            generation and qualification workflow
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <motion.div
                className="bg-white rounded-xl p-8 h-full flex flex-col shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 30 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div
                  className={`${step.iconBg} w-12 h-12 rounded-lg flex items-center justify-center mb-6`}
                >
                  {step.icon}
                </div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-gray-700">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {step.title}
                  </h3>
                </div>
                <p className="text-gray-600 mt-2">{step.description}</p>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="ml-6 w-6 h-6 text-blue-500" />
                  </div>
                )}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
