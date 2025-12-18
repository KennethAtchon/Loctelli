"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
import { Switch } from "@/components/ui/switch";

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  const pricingPlans = [
    {
      name: "Basic Plan",
      description: "Perfect for startups",
      price: isYearly ? 39 : 49,
      features: [
        "500 leads/month",
        "Basic analytics",
        "Email support",
        "1 user account",
        "CSV exports",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro Plan",
      description: "Ideal for growing businesses",
      price: isYearly ? 79 : 99,
      features: [
        "2,000 leads/month",
        "Advanced analytics",
        "Priority support",
        "5 user accounts",
        "API access",
        "Custom integrations",
      ],
      cta: "Get Started",
      highlighted: true,
    },
    {
      name: "Enterprise Plan",
      description: "For large teams",
      price: "Custom",
      features: [
        "Unlimited leads",
        "Dedicated account manager",
        "24/7 phone support",
        "Unlimited user accounts",
        "Advanced API access",
        "Custom reporting",
        "White-labeling options",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Simple, Transparent Pricing
          </motion.h2>
          <motion.div
            className="w-20 h-1 bg-teal-500 mx-auto mb-6"
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: 80 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <motion.p
            className="text-lg text-gray-600 max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Choose the plan that works best for your business needs
          </motion.p>

          <div className="flex items-center justify-center mb-12">
            <span
              className={`mr-3 text-sm ${
                !isYearly ? "font-medium text-gray-900" : "text-gray-500"
              }`}
            >
              Monthly
            </span>
            <div className="relative">
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-teal-500"
              />
              {isYearly && (
                <span className="absolute -top-8 -right-12 bg-teal-500 text-white text-xs px-2 py-1 rounded-full">
                  Save 20%
                </span>
              )}
            </div>
            <span
              className={`ml-3 text-sm ${
                isYearly ? "font-medium text-gray-900" : "text-gray-500"
              }`}
            >
              Yearly
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex"
            >
              <Card
                className={`w-full flex flex-col ${
                  plan.highlighted
                    ? "border-teal-500 shadow-lg relative"
                    : "border-gray-200"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-teal-500 text-white text-sm px-4 py-1 rounded-full">
                    Recommended
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-6">
                    {typeof plan.price === "number" ? (
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold">
                          ${plan.price}
                        </span>
                        <span className="text-gray-500 ml-2">/month</span>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold">{plan.price}</div>
                    )}
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="h-5 w-5 text-teal-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-teal-500 hover:bg-teal-600"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            variant="outline"
            className="mt-4 border-blue-500 text-blue-500 hover:bg-blue-50"
            onClick={() => open("https://calendly.com/loctelli-info/45min")}
          >
            Book a Demo
          </Button>
        </div>
      </div>
    </section>
  );
}
