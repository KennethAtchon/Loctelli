"use client";

import Link from "next/link";
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
import { BRANDING } from "@/lib/config/branding";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {BRANDING.company.name}
              </h3>
              <p className="text-sm text-gray-600">
                {BRANDING.company.tagline}
              </p>
            </div>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              {BRANDING.company.description}
            </p>

            {/* Contact Info */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center text-gray-600 text-sm">
                <Phone className="w-4 h-4 mr-2" />
                <span>{BRANDING.contact.phone.display}</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm">
                <Mail className="w-4 h-4 mr-2" />
                <span>{BRANDING.contact.email}</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{BRANDING.contact.address.full}</span>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <p className="text-gray-600 mb-3 text-sm">Follow Us</p>
              <div className="flex space-x-3">
                <a
                  href={BRANDING.social.facebook}
                  className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Facebook className="w-4 h-4 text-gray-600" />
                </a>
                <a
                  href={BRANDING.social.twitter}
                  className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Twitter className="w-4 h-4 text-gray-600" />
                </a>
                <a
                  href={BRANDING.social.linkedin}
                  className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Linkedin className="w-4 h-4 text-gray-600" />
                </a>
                <a
                  href={BRANDING.social.instagram}
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
              {BRANDING.services.map((service) => {
                const IconComponent =
                  service.icon === "Globe"
                    ? Globe
                    : service.icon === "Star"
                      ? Star
                      : service.icon === "Users"
                        ? Users
                        : TrendingUp;
                const isInternal = service.href.startsWith("/");
                return (
                  <li key={service.name}>
                    {isInternal ? (
                      <Link
                        href={service.href}
                        className="text-gray-600 hover:text-gray-900 transition-colors text-sm flex items-center"
                      >
                        <IconComponent className="w-3 h-3 mr-2" />
                        {service.name}
                      </Link>
                    ) : (
                      <a
                        href={service.href}
                        className="text-gray-600 hover:text-gray-900 transition-colors text-sm flex items-center"
                      >
                        <IconComponent className="w-3 h-3 mr-2" />
                        {service.name}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              {BRANDING.companyLinks.map((link) => {
                const isInternal = link.href.startsWith("/");
                return (
                  <li key={link.name}>
                    {isInternal ? (
                      <Link
                        href={link.href}
                        className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                      >
                        {link.name}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="w-full mb-4 md:mb-0">
              <div className="text-xs text-gray-500 mb-2">
                {BRANDING.legal.calendly.note}
              </div>
              <div className="text-gray-500 text-sm">
                {BRANDING.legal.copyright}
              </div>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-1 text-xs">
              <Link
                href={BRANDING.legal.privacy}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href={BRANDING.legal.terms}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href={BRANDING.legal.cookies}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cookie Policy
              </Link>
              <a
                href={BRANDING.legal.calendly.privacy}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Calendly Privacy Policy
              </a>
              <a
                href={BRANDING.legal.calendly.terms}
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
