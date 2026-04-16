import { Resend } from 'resend';

import type { ConfirmationEmailData } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@escueladewok.com';

const OWNER_EMAIL = 'Xingyutian2001@gmail.com';

export async function sendOwnerNotificationEmail(data: {
  courseName: string;
  courseDate: string;
  timeRange: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  dietaryRestrictions?: string;
}) {
  const { courseName, courseDate, timeRange, customerName, customerEmail, customerPhone, dietaryRestrictions } = data;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: OWNER_EMAIL,
    subject: `New booking: ${courseName} — ${customerName}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head><meta charset="UTF-8" /><style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; margin: 0; padding: 0; background: #f9f5f0; }
          .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: #c0392b; padding: 32px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 24px; }
          .body { padding: 32px; }
          .details { background: #f9f5f0; border-radius: 8px; padding: 24px; margin: 16px 0; }
          .details table { width: 100%; border-collapse: collapse; }
          .details td { padding: 8px 0; vertical-align: top; }
          .details td:first-child { font-weight: 600; width: 40%; }
        </style></head>
        <body>
          <div class="wrapper">
            <div class="header"><h1>New Booking</h1></div>
            <div class="body">
              <div class="details">
                <table>
                  <tr><td>Course</td><td>${courseName}</td></tr>
                  <tr><td>Date</td><td>${courseDate}</td></tr>
                  <tr><td>Time</td><td>${timeRange}</td></tr>
                  <tr><td>Name</td><td>${customerName}</td></tr>
                  <tr><td>Email</td><td>${customerEmail}</td></tr>
                  <tr><td>Phone</td><td>${customerPhone || '—'}</td></tr>
                  ${dietaryRestrictions ? `<tr><td>Dietary</td><td>${dietaryRestrictions}</td></tr>` : ''}
                </table>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    throw new Error(`Failed to send owner notification email: ${error.message}`);
  }
}

export async function sendConfirmationEmail(data: ConfirmationEmailData) {
  const { to, recipientName, courseName, courseDate, timeRange, amount, currency } = data;

  const { data: result, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Booking confirmed: ${courseName}`,
    html: buildConfirmationHtml({ recipientName, courseName, courseDate, timeRange, amount, currency }),
  });

  if (error) {
    throw new Error(`Failed to send confirmation email: ${error.message}`);
  }

  return result;
}

function buildConfirmationHtml({
  recipientName,
  courseName,
  courseDate,
  timeRange,
  amount,
  currency,
}: Omit<ConfirmationEmailData, 'to'>) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Booking Confirmed</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; margin: 0; padding: 0; background: #f9f5f0; }
          .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: #c0392b; padding: 32px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 24px; }
          .body { padding: 32px; }
          .body p { margin: 0 0 16px; line-height: 1.6; }
          .details { background: #f9f5f0; border-radius: 8px; padding: 24px; margin: 24px 0; }
          .details table { width: 100%; border-collapse: collapse; }
          .details td { padding: 8px 0; vertical-align: top; }
          .details td:first-child { font-weight: 600; width: 40%; }
          .footer { padding: 24px 32px; text-align: center; color: #999; font-size: 14px; border-top: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>Escuela de Wok</h1>
          </div>
          <div class="body">
            <p>Hi ${recipientName},</p>
            <p>Your booking has been confirmed! We look forward to cooking with you.</p>
            <div class="details">
              <table>
                <tr><td>Course</td><td>${courseName}</td></tr>
                <tr><td>Date</td><td>${courseDate}</td></tr>
                <tr><td>Time</td><td>${timeRange}</td></tr>
                <tr><td>Amount paid</td><td>${amount} ${currency}</td></tr>
              </table>
            </div>
            <p>If you have any questions, please reply to this email.</p>
            <p>See you in the kitchen!</p>
          </div>
          <div class="footer">
            <p>Escuela de Wok &mdash; Chinese Cooking Classes</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
