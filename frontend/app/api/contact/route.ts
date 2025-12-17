import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, phone, services } = await request.json();

    // Validate required fields
    if (!fullName || !email || !phone || !services) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Create email content
    const serviceLabels: Record<string, string> = {
      "free-website": "Free Website",
      "google-reviews": "Google Reviews System",
      "customer-reactivation": "Customer Reactivation",
      "lead-generation": "AI Lead Generation",
      "all-services": "All Services",
    };

    const emailContent = {
      to: "info@loctelli.com",
      subject: `New Contact Form Submission - ${fullName}`,
      text: `
New contact form submission:

Name: ${fullName}
Email: ${email}
Phone: ${phone}
Services Interested In: ${serviceLabels[services] || services}

Please follow up within 24 hours.
      `,
      html: `
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${fullName}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Phone:</strong> ${phone}</p>
<p><strong>Services Interested In:</strong> ${serviceLabels[services] || services}</p>
<p><em>Please follow up within 24 hours.</em></p>
      `,
    };

    // For now, we'll just log the email content since we need email service configuration
    console.log("Contact form submission:", emailContent);

    // TODO: Integrate with email service (SendGrid, SES, etc.)
    // Example with SendGrid:
    // await sendEmail(emailContent);

    return NextResponse.json({
      message: "Contact form submitted successfully",
      data: {
        fullName,
        email,
        phone,
        services: serviceLabels[services] || services,
      },
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 }
    );
  }
}
