"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    id: 1,
    name: "Jane Doe",
    title: "Marketing Director",
    company: "TechTrend",
    quote:
      "Loctelli doubled our conversion rates in just two weeks! The personalized outreach capabilities are truly game-changing for our marketing team.",
    avatar: "/placeholder.svg?height=80&width=80",
    rating: 5,
  },
  {
    id: 2,
    name: "John Smith",
    title: "Sales Manager",
    company: "GrowthForce",
    quote:
      "We've tried several lead generation tools, but Loctelli is in a league of its own. The quality of leads and insights has transformed our sales process.",
    avatar: "/placeholder.svg?height=80&width=80",
    rating: 5,
  },
  {
    id: 3,
    name: "Sarah Johnson",
    title: "CEO",
    company: "Innovate Inc",
    quote:
      "As a startup founder, I needed a solution that could scale with us. Loctelli not only delivered quality leads but provided the analytics we needed to refine our approach.",
    avatar: "/placeholder.svg?height=80&width=80",
    rating: 5,
  },
  {
    id: 4,
    name: "Michael Chen",
    title: "Growth Lead",
    company: "FutureTech",
    quote:
      "The AI-driven insights from LeadSpark have been invaluable. We're now targeting the right prospects with the right message at the right time.",
    avatar: "/placeholder.svg?height=80&width=80",
    rating: 4,
  },
  {
    id: 5,
    name: "Emily Rodriguez",
    title: "Digital Marketing Specialist",
    company: "MarketBoost",
    quote:
      "Loctelli has completely revolutionized how we approach lead generation. The platform's ability to identify high-quality prospects has increased our conversion rate by 45%.",
    avatar: "/placeholder.svg?height=80&width=80",
    rating: 5,
  },
  {
    id: 6,
    name: "David Kim",
    title: "VP of Sales",
    company: "SalesPro Solutions",
    quote:
      "After implementing Loctelli, our sales team spends less time prospecting and more time closing deals. The ROI has been incredible - we've seen a 3x increase in qualified leads.",
    avatar: "/placeholder.svg?height=80&width=80",
    rating: 5,
  },
];

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleTestimonials, setVisibleTestimonials] = useState<
    typeof testimonials
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, {
    once: false,
    margin: "-100px",
  });

  useEffect(() => {
    function updateVisibleTestimonials() {
      const width = window.innerWidth;
      if (width >= 1280) {
        // Show 3 testimonials on extra large screens
        setVisibleTestimonials([
          testimonials[activeIndex % testimonials.length],
          testimonials[(activeIndex + 1) % testimonials.length],
          testimonials[(activeIndex + 2) % testimonials.length],
        ]);
      } else if (width >= 768) {
        // Show 2 testimonials on medium screens
        setVisibleTestimonials([
          testimonials[activeIndex % testimonials.length],
          testimonials[(activeIndex + 1) % testimonials.length],
        ]);
      } else {
        // Show 1 testimonial on small screens
        setVisibleTestimonials([
          testimonials[activeIndex % testimonials.length],
        ]);
      }
    }

    updateVisibleTestimonials();
    window.addEventListener("resize", updateVisibleTestimonials);

    return () => {
      window.removeEventListener("resize", updateVisibleTestimonials);
    };
  }, [activeIndex]);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  return (
    <section
      id="testimonials"
      className="py-24 bg-gradient-to-b from-blue-50 to-white"
    >
      <div className="container" ref={containerRef}>
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            What Our Users Say
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
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Trusted by marketing and sales professionals worldwide
          </motion.p>
        </div>

        <div className="relative px-4">
          <div className="flex justify-center gap-6 flex-wrap md:flex-nowrap">
            {visibleTestimonials.map((testimonial, index) => (
              <TestimonialCard
                key={`${testimonial.id}-${index}`}
                testimonial={testimonial}
                index={index}
              />
            ))}
          </div>

          <div className="flex justify-center mt-12 gap-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-blue-200 hover:border-blue-300 hover:bg-blue-50"
              onClick={prevTestimonial}
            >
              <ChevronLeft className="h-5 w-5 text-blue-500" />
              <span className="sr-only">Previous</span>
            </Button>

            <div className="flex space-x-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    idx === activeIndex
                      ? "bg-teal-500"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-blue-200 hover:border-blue-300 hover:bg-blue-50"
              onClick={nextTestimonial}
            >
              <ChevronRight className="h-5 w-5 text-blue-500" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-4xl font-bold text-teal-500 mb-2">500+</div>
            <p className="text-gray-600">Happy Customers</p>
          </motion.div>
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-4xl font-bold text-teal-500 mb-2">10M+</div>
            <p className="text-gray-600">Leads Generated</p>
          </motion.div>
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="text-4xl font-bold text-teal-500 mb-2">98%</div>
            <p className="text-gray-600">Customer Satisfaction</p>
          </motion.div>
        </div>

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Button
            className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-6 text-lg rounded-full transition-transform hover:scale-105"
            onClick={() => open("https://calendly.com/loctelli-info/45min")}
          >
            Book a Demo
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[0];
  index: number;
}) {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-md p-8 flex flex-col w-full md:max-w-md relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Quote className="absolute top-6 right-6 w-12 h-12 text-blue-100 opacity-50" />

      <div className="flex items-center mb-6">
        <Avatar className="h-14 w-14 border-2 border-blue-100">
          <AvatarImage
            src={testimonial.avatar || "/placeholder.svg"}
            alt={testimonial.name}
          />
          <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="ml-4">
          <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
          <p className="text-sm text-gray-600">
            {testimonial.title}, {testimonial.company}
          </p>
        </div>
      </div>

      <div className="flex mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < testimonial.rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>

      <p className="text-gray-700 italic flex-grow mb-4">
        "{testimonial.quote}"
      </p>

      <div className="h-1 w-16 bg-blue-100 rounded-full" />
    </motion.div>
  );
}
