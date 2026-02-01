/**
 * Centralized Branding Configuration
 * All branding information should be imported from this file
 */

export const BRANDING = {
  company: {
    name: "Loctelli",
    legalStructure: "a sole proprietorship",
    tagline: "AI Marketing Solutions",
    description:
      "We help businesses grow with AI-powered marketing solutions including free websites, automated Google reviews, customer reactivation, and lead generation.",
  },
  contact: {
    phone: {
      display: "(360) 504-6054",
      formatted: "(360) 504-6054",
      placeholder: "(360) 504-6054",
      international: "+1 (360) 504-6054",
      raw: "3605046054",
    },
    email: "info@loctelli.com",
    address: {
      street: "500 Peconic St",
      city: "Ronkonkoma",
      state: "NY",
      zip: "11779",
      full: "500 Peconic St, Ronkonkoma, NY 11779, United States",
      short: "Ronkonkoma, NY 11779",
    },
    responseTime: "Within 24 hours",
  },
  social: {
    facebook: "#",
    twitter: "#",
    linkedin: "#",
    instagram: "#",
  },
  legal: {
    copyright: `© ${new Date().getFullYear()} Loctelli. All rights reserved.`,
    privacy: "/privacy",
    terms: "/terms",
    cookies: "/cookies",
    calendly: {
      privacy: "https://calendly.com/legal/privacy-notice",
      terms: "https://calendly.com/legal/terms",
      note: "Bookings handled via Calendly. See Calendly's Privacy Policy and Terms of Use for more info.",
    },
  },
  services: [
    { name: "Free Websites", icon: "Globe", href: "/#services" },
    { name: "Google Reviews", icon: "Star", href: "/#services" },
    { name: "Customer Reactivation", icon: "Users", href: "/#services" },
    { name: "Lead Generation", icon: "TrendingUp", href: "/#services" },
  ],
  companyLinks: [
    { name: "About Us", href: "/about" },
    { name: "Success Stories", href: "/success-stories" },
    { name: "Case Studies", href: "/case-studies" },
    { name: "Resources", href: "/resources" },
    { name: "Contact", href: "/#contact" },
  ],
} as const;

// Type export for TypeScript support
export type BrandingConfig = typeof BRANDING;
