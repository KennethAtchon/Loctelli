"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Menu, X } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <nav className="bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/favicon-white-on-black.png"
              alt="Loctelli Logo"
              width={32}
              height={32}
              className="mr-2"
              onClick={() => router.push("/")}
            />
            <Link
              href="/"
              className="text-xl font-bold text-blue-600"
              onClick={() => router.push("/")}
            >
              Loctelli
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link
              href="/#home"
              className="text-gray-700 hover:text-purple-600 transition-colors font-medium relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href="/#services"
              className="text-gray-700 hover:text-purple-600 transition-colors font-medium relative group"
            >
              Services
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href="/#process"
              className="text-gray-700 hover:text-purple-600 transition-colors font-medium relative group"
            >
              Process
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href="/#contact"
              className="text-gray-700 hover:text-purple-600 transition-colors font-medium relative group"
            >
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* CTA Button */}
            <Button
              onClick={() => open("https://calendly.com/loctelli-info/45min")}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Calendar className="w-3 h-3 mr-2" />
              Book a Call
            </Button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-3 space-y-2">
            <a
              href="#home"
              className="block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2"
            >
              Home
            </a>
            <a
              href="#services"
              className="block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2"
            >
              Services
            </a>
            <a
              href="#process"
              className="block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2"
            >
              Process
            </a>
            <a
              href="#contact"
              className="block text-gray-700 hover:text-purple-600 transition-colors font-medium py-2"
            >
              Contact
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
