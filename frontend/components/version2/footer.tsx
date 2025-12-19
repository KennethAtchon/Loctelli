"use client";

import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Globe,
  Star,
  Users,
  TrendingUp,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">Loctelli</h3>
              <p className="text-sm text-gray-600">AI Marketing Solutions</p>
            </div>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              We help businesses grow with AI-powered marketing solutions
              including free websites, automated Google reviews, customer
              reactivation, and lead generation.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center text-gray-600 text-sm">
                <Phone className="w-4 h-4 mr-2" />
                <span>(555) 123-4567</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm">
                <Mail className="w-4 h-4 mr-2" />
                <span>info@loctelli.com</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm">
                <MapPin className="w-4 h-4 mr-2" />
                <span>New York, NY 10001</span>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <p className="text-gray-600 mb-3 text-sm">Follow Us</p>
              <div className="flex space-x-3">
                <a
                  href="#"
                  className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Facebook className="w-4 h-4 text-gray-600" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Twitter className="w-4 h-4 text-gray-600" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Linkedin className="w-4 h-4 text-gray-600" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Instagram className="w-4 h-4 text-gray-600" />
                </a>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Services
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#services"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm flex items-center"
                >
                  <Globe className="w-3 h-3 mr-2" />
                  Free Websites
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm flex items-center"
                >
                  <Star className="w-3 h-3 mr-2" />
                  Google Reviews
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm flex items-center"
                >
                  <Users className="w-3 h-3 mr-2" />
                  Customer Reactivation
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm flex items-center"
                >
                  <TrendingUp className="w-3 h-3 mr-2" />
                  Lead Generation
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Success Stories
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Case Studies
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Resources
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="w-full mb-4 md:mb-0">
              <div className="text-xs text-gray-500 mb-2">
                Bookings handled via Calendly. See Calendly's Privacy Policy and
                Terms of Use for more info.
              </div>
              <div className="text-gray-500 text-sm">
                &copy; 2025 Loctelli. All rights reserved.
              </div>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end space-x-4 text-xs">
              <a
                href="#"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cookie Policy
              </a>
              <a
                href="https://calendly.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Calendly Privacy Policy
              </a>
              <a
                href="https://calendly.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Calendly Terms of Use
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
