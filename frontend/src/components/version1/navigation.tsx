import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-sm shadow-sm py-2"
          : "bg-transparent py-4",
      )}
    >
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
            Loctelli
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a
            href="#"
            className="font-medium text-gray-800 hover:text-blue-500 transition-colors"
          >
            Home
          </a>
          <a
            href="#how-it-works"
            className="font-medium text-gray-800 hover:text-blue-500 transition-colors"
          >
            How It Works
          </a>
          <a
            href="#features"
            className="font-medium text-gray-800 hover:text-blue-500 transition-colors"
          >
            Features
          </a>
          <a
            href="#demo"
            className="font-medium text-gray-800 hover:text-blue-500 transition-colors"
          >
            Demo
          </a>
          {/* <a
            href="#pricing"
            className="font-medium text-gray-800 hover:text-blue-500 transition-colors"
          >
            Pricing
          </a>
          <a
            href="#testimonials"
            className="font-medium text-gray-800 hover:text-blue-500 transition-colors"
          >
            Testimonials
          </a> */}
          <a
            href="#contact"
            className="font-medium text-gray-800 hover:text-blue-500 transition-colors"
          >
            Contact
          </a>
          <Button
            className="bg-teal-500 hover:bg-teal-600 text-white"
            onClick={() => open("https://calendly.com/loctelli-info/45min")}
          >
            Book a Demo
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-800"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-md py-4">
          <div className="container flex flex-col space-y-4">
            <a
              href="#"
              className="font-medium text-gray-800 hover:text-blue-500 transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </a>
            <a
              href="#how-it-works"
              className="font-medium text-gray-800 hover:text-blue-500 transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#features"
              className="font-medium text-gray-800 hover:text-blue-500 transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#pricing"
              className="font-medium text-gray-800 hover:text-blue-500 transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <a
              href="#testimonials"
              className="font-medium text-gray-800 hover:text-blue-500 transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Testimonials
            </a>
            <a
              href="#contact"
              className="font-medium text-gray-800 hover:text-blue-500 transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </a>
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-white w-full"
              onClick={() => {
                setIsMobileMenuOpen(false);
                open("https://calendly.com/loctelli-info/45min");
              }}
            >
              Book a Demo
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
