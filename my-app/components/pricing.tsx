"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const plans = [
  {
    name: "Starter",
    price: 499,
    description:
      "Perfect for small businesses just getting started with AI-powered lead generation.",
    features: [
      "Up to 100 qualified leads per month",
      "Basic AI chat qualification",
      "Email and calendar integration",
      "8am-5pm support",
      "Basic analytics dashboard",
    ],
    cta: "Get Started",
    popular: false,
    color: "from-blue-500 to-blue-600",
  },
  {
    name: "Pro",
    price: 999,
    description:
      "Ideal for growing businesses looking to scale their lead generation efforts.",
    features: [
      "Up to 500 qualified leads per month",
      "Advanced AI chat qualification",
      "Full CRM integration",
      "24/7 support",
      "Advanced analytics and reporting",
      "Custom qualification criteria",
      "Multi-channel lead capture",
    ],
    cta: "Get Started",
    popular: true,
    color: "from-blue-500 to-purple-600",
  },
  {
    name: "Enterprise",
    price: null,
    description:
      "Tailored solutions for large organizations with complex sales processes.",
    features: [
      "Unlimited qualified leads",
      "Custom AI training and optimization",
      "Full enterprise system integration",
      "Dedicated account manager",
      "Custom analytics and reporting",
      "SLA guarantees",
      "White-labeled solution available",
      "Custom development options",
    ],
    cta: "Contact Us",
    popular: false,
    color: "from-purple-500 to-purple-600",
  },
];

export default function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="pricing" className="py-24 bg-gray-950 relative" ref={ref}>
      {/* Glowing orbs */}
      <div className="absolute top-40 left-20 w-64 h-64 bg-blue-500 rounded-full filter blur-[128px] opacity-10"></div>
      <div className="absolute bottom-40 right-20 w-64 h-64 bg-purple-500 rounded-full filter blur-[128px] opacity-10"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            Simple{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </motion.h2>
          <motion.p
            className="text-xl text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Transparent pricing plans designed to scale with your business
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              className="flex"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <Card
                className={`w-full bg-gray-900 border-gray-800 ${
                  plan.popular ? "relative ring-2 ring-blue-500" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium py-1 px-4 rounded-full">
                    Most Popular
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="mb-6">
                    {plan.price ? (
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold">
                          ${plan.price}
                        </span>
                        <span className="text-gray-400 ml-2">/month</span>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold">Custom</div>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center mr-2 mt-0.5`}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white`}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
