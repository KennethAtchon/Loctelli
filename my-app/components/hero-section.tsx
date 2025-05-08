"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="pt-32 pb-20 bg-gradient-to-b from-blue-50 to-white">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 mb-6">
              Supercharge Your Sales with{" "}
              <span className="bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
                AI-Powered Lead Generation
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-lg">
              Find high-quality leads effortlessly with Loctelli's intelligent
              platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => open("https://calendly.com/loctelli-info/30min")}
                className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-6 text-lg rounded-full transition-transform hover:scale-105"
              >
                Book a Demo
              </Button>
              {/* <Button
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-50 px-8 py-6 text-lg rounded-full"
              >
                Learn More
              </Button> */}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <NetworkAnimation />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function NetworkAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    setCanvasDimensions();
    window.addEventListener("resize", setCanvasDimensions);

    // Create nodes
    const nodeCount = 30;
    const nodes: {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      color: string;
    }[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 3 + 2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        color: i % 3 === 0 ? "#3B82F6" : i % 3 === 1 ? "#14B8A6" : "#F97316",
      });
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < nodes.length; j++) {
          const otherNode = nodes[j];
          const dx = otherNode.x - node.x;
          const dy = otherNode.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.strokeStyle = `rgba(100, 116, 139, ${
              0.2 * (1 - distance / 100)
            })`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", setCanvasDimensions);
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden bg-white shadow-xl">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />
    </div>
  );
}
