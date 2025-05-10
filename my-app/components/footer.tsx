"use client";

import Link from "next/link";
import { Linkedin, Twitter, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer className="bg-white text-gray-800 pt-16 pb-8 border-t border-gray-100">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
                Loctelli
              </span>
            </Link>
            <p className="text-gray-600 mb-6">
              AI-powered lead generation to supercharge your sales and marketing
              efforts.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-500 hover:text-blue-500 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-blue-500 transition-colors"
              >
                <Twitter className="w-5 h-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-blue-500 transition-colors"
              >
                <Instagram className="w-5 h-5" />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-gray-600 hover:text-blue-500 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-gray-600 hover:text-blue-500 transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="#features"
                  className="text-gray-600 hover:text-blue-500 transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-gray-600 hover:text-blue-500 transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="#testimonials"
                  className="text-gray-600 hover:text-blue-500 transition-colors"
                >
                  Testimonials
                </Link>
              </li>
              <li>
                <Link
                  href="#contact"
                  className="text-gray-600 hover:text-blue-500 transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4">
              Subscribe to Our Newsletter
            </h4>
            <p className="text-gray-600 mb-4">
              Get the latest updates and insights on lead generation.
            </p>
            <div className="flex space-x-2">
              <Input
                placeholder="Your email"
                className="bg-white border-gray-200"
              />
              <Button className="bg-teal-500 hover:bg-teal-600">
                Subscribe
              </Button>
            </div>

            <div className="mt-8">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="https://calendly.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-500 transition-colors"
                  >
                    Calendly Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://calendly.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-500 transition-colors"
                  >
                    Calendly Terms of Use
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="w-full mb-4 md:mb-0">
            <div className="text-xs text-gray-500 mb-2">
              Bookings handled via Calendly. See Calendly’s Privacy Policy and
              Terms of Use for more info.
            </div>
            <div className="text-gray-600">
              © 2025 Loctelli. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
