"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Play, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DemoSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="demo" className="py-24 bg-blue-50" ref={ref}>
      <div className="container">
        <div className="text-center mb-12">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            See LeadSpark AI in Action
          </motion.h2>
          <motion.div
            className="w-20 h-1 bg-teal-500 mx-auto mb-6"
            initial={{ opacity: 0, width: 0 }}
            animate={isInView ? { opacity: 1, width: 80 } : { opacity: 0, width: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <motion.p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Watch our live demo to see how LeadSpark AI can transform your lead generation process
          </motion.p>
        </div>

        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative aspect-video bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            {/* Video Placeholder - Replace with actual video embed code when ready */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-blue-600 transition-colors">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
                <p className="text-gray-500 font-medium">Video Demo</p>
              </div>
            </div>

            {/* This comment shows where to add the actual video embed code */}
            {/* 
              To embed a video, replace the div above with:
              
              <iframe 
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID" 
                title="LeadSpark AI Demo" 
                className="absolute inset-0 w-full h-full" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            */}
          </div>

          <div className="mt-8 text-center">
            <Button className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-6 text-lg rounded-full">
              Schedule a Personalized Demo <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
