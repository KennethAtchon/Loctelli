/**
 * Centralized Branding Configuration
 * All branding information should be imported from this file
 */

export const BRANDING = {
  company: {
    name: "Loctelli",
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
      street: "350 5th Ave, Suite 2000",
      city: "New York",
      state: "NY",
      zip: "10118",
      full: "350 5th Ave, Suite 2000, New York, NY 10118",
      short: "New York, NY 10118",
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
    calendly: {
      privacy: "https://calendly.com/privacy",
      terms: "https://calendly.com/terms",
      note: "Bookings handled via Calendly. See Calendly's Privacy Policy and Terms of Use for more info.",
    },
  },
  services: [
    {
      name: "Free Websites",
      icon: "Globe",
      href: "#services",
    },
    {
      name: "Google Reviews",
      icon: "Star",
      href: "#services",
    },
    {
      name: "Customer Reactivation",
      icon: "Users",
      href: "#services",
    },
    {
      name: "Lead Generation",
      icon: "TrendingUp",
      href: "#services",
    },
  ],
  companyLinks: [
    { name: "About Us", href: "#" },
    { name: "Success Stories", href: "#" },
    { name: "Case Studies", href: "#" },
    { name: "Resources", href: "#" },
    { name: "Contact", href: "#" },
  ],
} as const;

// Type export for TypeScript support
export type BrandingConfig = typeof BRANDING;
