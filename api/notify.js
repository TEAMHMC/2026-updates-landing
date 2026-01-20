// api/notify.js
// Vercel serverless function to handle email subscriptions via SendGrid
// Save this file to api/notify.js in your project root

import sgMail from '@sendgrid/mail';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Validate email
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // Validate API key is set
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Email to internal team
    const internalMsg = {
      to: 'contact@healthmatters.clinic',
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@healthmatters.clinic',
      replyTo: email,
      subject: '🎉 New 2026 Updates Subscriber',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #233DFF 0%, #1f2fd9 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h2 style="color: white; margin: 0;">New Subscriber Alert</h2>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #233DFF;">
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0 0 10px 0;"><strong>Source:</strong> 2026 Updates Landing Page</p>
            <p style="margin: 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
            This subscriber is interested in Health Matters Clinic's 2026 updates and announcements.
          </p>
        </div>
      `,
    };

    await sgMail.send(internalMsg);
    console.log('Internal notification sent to contact@healthmatters.clinic');

    // Confirmation email to subscriber
    const confirmationMsg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@healthmatters.clinic',
      subject: "We've Got You! 2026 Updates Coming Soon",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #233DFF 0%, #1f2fd9 100%); padding: 40px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 32px;">We've Got You!</h1>
          </div>
          
          <div style="padding: 0 20px;">
            <h2 style="color: #0f172a; font-size: 20px;">Thanks for signing up</h2>
            <p style="color: #475569; line-height: 1.6;">
              We're excited to have you on the list for Health Matters Clinic's 2026 updates. 
              We're reimagining what's possible in community health care, and we can't wait to share 
              what's coming next.
            </p>
            
            <p style="color: #475569; line-height: 1.6;">
              Keep an eye on your inbox for exclusive previews and announcements.
            </p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #233DFF;">
              <p style="margin: 0; color: #233DFF; font-weight: 600;">Health Matters Clinic</p>
              <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">
                Breaking down barriers to healthcare access for underserved communities in Los Angeles
              </p>
            </div>
            
            <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              If you have questions, reach out to us at contact@healthmatters.clinic
            </p>
          </div>
        </div>
      `,
    };

    await sgMail.send(confirmationMsg);
    console.log('Confirmation email sent to subscriber:', email);

    return res.status(200).json({ 
      success: true,
      message: 'Successfully subscribed'
    });
  } catch (error) {
    console.error('SendGrid error:', error);
    
    // Return a generic error to frontend to avoid exposing sensitive details
    return res.status(500).json({ 
      error: 'Failed to process subscription. Please try again.' 
    });
  }
}
