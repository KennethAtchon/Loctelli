"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const blogPosts = [
  {
    title: "How AI is Revolutionizing Lead Generation",
    description: "Discover how artificial intelligence is transforming the way businesses generate and qualify leads.",
    date: "April 15, 2025",
    image: "/placeholder.svg?height=200&width=400",
    category: "AI Technology",
  },
  {
    title: "5 Ways to Optimize Your Sales Funnel with Automation",
    description: "Learn practical strategies to streamline your sales process and increase conversion rates.",
    date: "April 8, 2025",
    image: "/placeholder.svg?height=200&width=400",
    category: "Sales Strategy",
  },
  {
    title: "The Future of B2B Sales: AI-Powered Conversations",
    description: "Explore how conversational AI is changing the landscape of business-to-business sales.",
    date: "March 30, 2025",
    image: "/placeholder.svg?height=200&width=400",
    category: "Industry Trends",
  },
]

export default function Blog() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section id="blog" className="py-24 bg-gray-900 relative" ref={ref}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-0">
              Latest{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Insights
              </span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800 group">
              View All Articles
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <Card className="bg-gray-800 border-gray-700 overflow-hidden h-full flex flex-col hover:border-gray-600 transition-colors duration-300">
                <div className="h-48 overflow-hidden">
                  <img
                    src={post.image || "/placeholder.svg"}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>

                <CardHeader>
                  <div className="flex items-center mb-2">
                    <span className="text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                      {post.category}
                    </span>
                    <span className="mx-2 text-gray-500">•</span>
                    <span className="text-xs text-gray-400">{post.date}</span>
                  </div>
                  <CardTitle className="text-xl">{post.title}</CardTitle>
                  <CardDescription className="text-gray-400">{post.description}</CardDescription>
                </CardHeader>

                <CardFooter className="mt-auto">
                  <Button variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-gray-700 p-0 group">
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
