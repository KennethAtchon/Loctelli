"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <section
      className="relative h-screen flex items-center justify-center overflow-hidden"
      id="hero"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950"></div>

      {/* Animated grid lines */}
      <div className="absolute inset-0 opacity-20">
        <div className="h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </div>

      {/* Glowing orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500 rounded-full filter blur-[128px] opacity-20"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Automate Your Sales
              </span>{" "}
              with AI-Powered Funnels
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Loctelli creates ads, funnels leads into an AI chat system that
              qualifies and books meetings, all without lifting a finger.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6 h-auto">
              Get Started
            </Button>
            <Button
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800 text-lg px-8 py-6 h-auto"
              onClick={() => open("https://calendly.com/kennethatchon/30min")}
            >
              Book a Demo
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-gray-400 flex justify-center">
          <div className="w-1 h-3 bg-blue-500 rounded-full mt-2"></div>
        </div>
      </motion.div>
    </section>
  );
}
