"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { API_CONFIG } from "@/lib/utils/envUtils";
import { BRANDING } from "@/lib/config/branding";

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      services: formData.get("services") as string,
      source: "website",
    };

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSubmitMessage(
          `Thank you! We'll contact you within ${BRANDING.contact.responseTime.toLowerCase()}.`
        );
        (e.target as HTMLFormElement).reset();

        // Optional: Track conversion
        if (
          typeof window !== "undefined" &&
          "gtag" in window &&
          typeof (
            window as {
              gtag?: (
                command: string,
                event: string,
                params: Record<string, string>
              ) => void;
            }
          ).gtag === "function"
        ) {
          (
            window as {
              gtag: (
                command: string,
                event: string,
                params: Record<string, string>
              ) => void;
            }
          ).gtag("event", "form_submit", {
            event_category: "Contact",
            event_label: "Website Contact Form",
          });
        }
      } else {
        const error = await response.json();
        setSubmitMessage(
          error.message || "Failed to submit form. Please try again."
        );
      }
    } catch {
      setSubmitMessage("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <section id="contact" className="py-16 px-4 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Get Started with Your Free Consultation
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Fill out the form below and we'll get back to you within{" "}
            {BRANDING.contact.responseTime.toLowerCase()} to discuss how our AI
            marketing solutions can help grow your business.
          </p>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {submitMessage && (
            <div
              className={`mb-6 p-4 rounded-lg text-center ${
                submitMessage.includes("Thank you")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {submitMessage}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label
                htmlFor="fullName"
                className="text-sm font-medium text-gray-700"
              >
                Full Name *
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="mt-1"
                placeholder="Enter your full name"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700"
                >
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="mt-1"
                  placeholder={BRANDING.contact.phone.placeholder}
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="services"
                className="text-sm font-medium text-gray-700"
              >
                Which services are you interested in? *
              </Label>
              <Select name="services" required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select services you're interested in" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free-website">Free Website</SelectItem>
                  <SelectItem value="google-reviews">
                    Google Reviews System
                  </SelectItem>
                  <SelectItem value="customer-reactivation">
                    Customer Reactivation
                  </SelectItem>
                  <SelectItem value="lead-generation">
                    AI Lead Generation
                  </SelectItem>
                  <SelectItem value="all-services">All Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-center pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-8 py-3 text-lg"
              >
                {isSubmitting ? "Submitting..." : "Get Free Consultation"}
              </Button>
              <p className="text-sm text-gray-500 mt-3">
                We'll contact you within{" "}
                {BRANDING.contact.responseTime.toLowerCase()}
              </p>
            </div>
          </form>
        </div>

        {/* Simple Contact Info */}
        <div className="mt-12 text-center">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
              <p className="text-gray-600">{BRANDING.contact.phone.display}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">{BRANDING.contact.email}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Response Time
              </h3>
              <p className="text-gray-600">{BRANDING.contact.responseTime}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
