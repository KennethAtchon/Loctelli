"use client"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    id: 1,
    quote:
      "Loctelli tripled our booked meetings in a month! The AI qualification is so accurate that our sales team's conversion rate has improved dramatically.",
    author: "Sarah Johnson",
    title: "VP of Sales, TechCorp",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 2,
    quote:
      "We've been able to scale our outreach without adding headcount. The AI handles all our lead qualification 24/7, and our team only speaks with prospects who are ready to buy.",
    author: "Michael Chen",
    title: "CEO, GrowthMetrics",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 3,
    quote:
      "The seamless integration with our existing tools made implementation a breeze. Within days, we were seeing qualified meetings appear on our calendars automatically.",
    author: "Jessica Rivera",
    title: "Marketing Director, SaaS Solutions",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 4,
    quote:
      "As a startup founder, I was spending too much time on lead qualification. Loctelli has given me back 20 hours a week to focus on product development.",
    author: "Alex Thompson",
    title: "Founder, InnovateLabs",
    avatar: "/placeholder.svg?height=100&width=100",
  },
]

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section id="testimonials" className="py-24 bg-gray-900 relative overflow-hidden" ref={ref}>
      {/* Background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            What Our{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Clients Say
            </span>
          </motion.h2>
          <motion.p
            className="text-xl text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Success stories from businesses that have transformed their sales process
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            className="relative bg-gray-800 rounded-2xl p-8 md:p-10 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="absolute top-6 left-6 text-blue-500 opacity-30">
              <Quote size={48} />
            </div>

            <div className="relative z-10">
              <p className="text-xl md:text-2xl text-gray-200 mb-8 italic">"{testimonials[currentIndex].quote}"</p>

              <div className="flex items-center">
                <Avatar className="h-12 w-12 mr-4 border-2 border-blue-500">
                  <AvatarImage
                    src={testimonials[currentIndex].avatar || "/placeholder.svg"}
                    alt={testimonials[currentIndex].author}
                  />
                  <AvatarFallback>
                    {testimonials[currentIndex].author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h4 className="font-bold text-lg">{testimonials[currentIndex].author}</h4>
                  <p className="text-gray-400">{testimonials[currentIndex].title}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  index === currentIndex ? "bg-blue-500" : "bg-gray-700"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          <div className="flex justify-center mt-8 space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prevTestimonial}
              className="rounded-full border-gray-700 hover:bg-gray-800 hover:text-blue-500"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="rounded-full border-gray-700 hover:bg-gray-800 hover:text-blue-500"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
