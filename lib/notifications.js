export async function sendOrderEmail(customerEmail, orderDetails) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { id, total, items, status } = orderDetails;
    const itemsList = items?.map(item => `<li>${item.title} x${item.quantity} - $${((item.price || item.price_at_purchase) / 100).toFixed(2)}</li>`).join('') || '';
    
    const result = await resend.emails.send({
      from: 'Goodness Gracious Gabriel <onboarding@resend.dev>',
      to: customerEmail,
      subject: `Order Confirmation #${id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Order Confirmation</h2>
          <p>Thank you for your purchase!</p>
          <p><strong>Order ID:</strong> ${id}</p>
          <p><strong>Status:</strong> ${status}</p>
          <h3>Items:</h3>
          <ul>${itemsList}</ul>
          <p><strong>Total:</strong> $${(total / 100).toFixed(2)}</p>
          <p>We'll keep you updated on your order status.</p>
          <p>Thanks for supporting independent artists!</p>
        </div>
      `
    });
    
    console.log('📧 Email sent to', customerEmail, '- ID:', result.id);
    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendOrderSMS(phoneNumber, orderId, total) {
  // SMS disabled for now - email notifications only
  console.log('📱 SMS notification for order', orderId, '- would go to:', phoneNumber);
  return { success: true };
}

export async function sendAdminNotification(message) {
  // Email admin about new order/activity
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const result = await resend.emails.send({
      from: 'Goodness Gracious Gabriel <onboarding@resend.dev>',
      to: process.env.ADMIN_EMAIL,
      subject: 'Goodness Gracious Gabriel - Admin Alert',
      html: `<p>${message}</p>`
    });
    
    console.log('📩 Admin notification sent - ID:', result.id);
    return result;
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
}

export async function sendPasswordResetEmail(customerEmail, resetUrl, customerName) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: 'Goodness Gracious Gabriel <onboarding@resend.dev>',
      to: customerEmail,
      subject: 'Reset your Gabriel password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1f2937;">
          <h2>Reset your password</h2>
          <p>${customerName ? `Hi ${customerName},` : 'Hi there,'} we received a request to reset your password.</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#8f2d1f;color:#fff;text-decoration:none;border-radius:8px;">Reset Password</a></p>
          <p>If the button does not work, paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link expires in 1 hour.</p>
        </div>
      `,
    });

    console.log('📧 Password reset email sent to', customerEmail, '- ID:', result.id);
    return result;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}
