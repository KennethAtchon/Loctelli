import { Injectable, Logger } from '@nestjs/common';

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

interface ContactSubmission {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  services: string;
  submittedAt: Date;
  message?: string | null;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendContactNotification(contact: ContactSubmission) {
    const serviceLabels = {
      'free-website': 'Free Website',
      'google-reviews': 'Google Reviews System',
      'customer-reactivation': 'Customer Reactivation',
      'lead-generation': 'AI Lead Generation',
      'all-services': 'All Services',
    };

    const emailTemplate: EmailTemplate = {
      to: 'info@loctelli.com',
      subject: `🔥 New Lead: ${contact.fullName} - ${serviceLabels[contact.services] || contact.services}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Contact Form Submission</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Contact Details</h3>
            <p><strong>Name:</strong> ${contact.fullName}</p>
            <p><strong>Email:</strong> <a href="mailto:${contact.email}">${contact.email}</a></p>
            <p><strong>Phone:</strong> <a href="tel:${contact.phone}">${contact.phone}</a></p>
            <p><strong>Services:</strong> ${serviceLabels[contact.services] || contact.services}</p>
            <p><strong>Submitted:</strong> ${contact.submittedAt.toLocaleString()}</p>
            ${contact.message ? `<p><strong>Message:</strong> ${contact.message}</p>` : ''}
          </div>

          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="margin: 0;"><strong>⏰ Follow up within 24 hours for best results!</strong></p>
          </div>

          <div style="margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/contacts/${contact.id}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View in Admin Panel
            </a>
          </div>
        </div>
      `,
    };

    return this.sendEmail(emailTemplate);
  }

  private async sendEmail(template: EmailTemplate): Promise<void> {
    // TODO: Integrate with your email service (SendGrid, SES, etc.)
    // For now, just log the email that would be sent
    this.logger.log(`📧 Email would be sent to: ${template.to}`);
    this.logger.log(`📧 Subject: ${template.subject}`);
    this.logger.debug(`📧 HTML Content: ${template.html.substring(0, 200)}...`);

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.log(`✅ Email notification sent for contact form submission`);
  }
}
