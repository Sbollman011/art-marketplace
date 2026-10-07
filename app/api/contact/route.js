export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return Response.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    if (message.length < 10) {
      return Response.json(
        { error: 'Message must be at least 10 characters' },
        { status: 400 }
      );
    }

    const { query } = await import('@/lib/db');
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Get all admin emails from database
    const adminResult = await query('SELECT email FROM admins ORDER BY email ASC');
    const adminEmails = adminResult.rows.map(admin => admin.email);

    if (adminEmails.length === 0) {
      return Response.json(
        { error: 'No admin contacts available' },
        { status: 500 }
      );
    }

    // Send email to all admins
    const { data, error: sendError } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Goodness Gracious Gabriel <onboarding@resend.dev>',
      to: adminEmails,
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333;">
          <h2 style="color: #ec4899;">New Contact Form Message</h2>
          
          <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
            <p style="margin: 0 0 0.5rem 0;"><strong>Name:</strong></p>
            <p style="margin: 0 0 1.5rem 0; font-size: 1.1rem;">${name}</p>
            
            <p style="margin: 0 0 0.5rem 0;"><strong>Email:</strong></p>
            <p style="margin: 0 0 1.5rem 0; font-size: 1.1rem;">
              <a href="mailto:${email}" style="color: #ec4899; text-decoration: none;">${email}</a>
            </p>
            
            <p style="margin: 0 0 0.5rem 0;"><strong>Message:</strong></p>
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          
          <p style="color: #64748b; font-size: 0.9rem; margin-top: 2rem;">
            Reply to this email to respond directly to ${name}
          </p>
        </div>
      `
    });

    if (sendError) {
      throw new Error(sendError.message);
    }

    console.log(`📧 Contact form email sent to ${adminEmails.length} admin(s) - ID: ${data?.id} from ${name} (${email})`);

    return Response.json({
      success: true,
      message: 'Your message has been sent successfully'
    });
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return Response.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}
