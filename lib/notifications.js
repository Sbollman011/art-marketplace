export async function sendOrderEmail(customerEmail, orderDetails) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { id, total, items, status } = orderDetails;
    const itemsList = items?.map(item => `<li>${item.title} x${item.quantity} - $${(item.price_at_purchase / 100).toFixed(2)}</li>`).join('') || '';
    
    const result = await resend.emails.send({
      from: 'Art Marketplace <onboarding@resend.dev>',
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
      from: 'Art Marketplace <onboarding@resend.dev>',
      to: process.env.ADMIN_EMAIL,
      subject: 'Art Marketplace Admin Alert',
      html: `<p>${message}</p>`
    });
    
    console.log('📩 Admin notification sent - ID:', result.id);
    return result;
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
}
