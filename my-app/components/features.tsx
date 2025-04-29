"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Clock, Bot, Zap, BarChart3, Shield, Layers } from "lucide-react"

const features = [
  {
    icon: Clock,
    title: "Hands-Free Automation",
    description: "Set it up once and let our AI handle the rest. No manual intervention required.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Bot,
    title: "24/7 Lead Qualification",
    description: "Our AI works around the clock, qualifying leads even while you sleep.",
    color: "from-indigo-500 to-indigo-600",
  },
  {
    icon: Zap,
    title: "Seamless Integration",
    description: "Connects with your existing CRM, calendar, and marketing tools without friction.",
    color: "from-violet-500 to-violet-600",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Gain insights into your funnel performance with detailed conversion metrics.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption and compliance with data protection regulations.",
    color: "from-fuchsia-500 to-fuchsia-600",
  },
  {
    icon: Layers,
    title: "Scalable Infrastructure",
    description: "Handles thousands of leads simultaneously without performance degradation.",
    color: "from-pink-500 to-pink-600",
  },
]

export default function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section id="features" className="py-24 bg-gray-950 relative" ref={ref}>
      {/* Glowing orbs */}
      <div className="absolute top-40 right-20 w-64 h-64 bg-blue-500 rounded-full filter blur-[128px] opacity-10"></div>
      <div className="absolute bottom-40 left-20 w-64 h-64 bg-purple-500 rounded-full filter blur-[128px] opacity-10"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            Powerful{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">Features</span>
          </motion.h2>
          <motion.p
            className="text-xl text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Empower your business with next-gen AI technology that scales effortlessly
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
