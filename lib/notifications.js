const FROM_ADDRESS = process.env.EMAIL_FROM || 'Goodness Gracious Gabriel <onboarding@resend.dev>';

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderOrderDetailsHtml(order) {
  const items = (order.items || []).filter((item) => item && item.title);

  const itemRows = items
    .map((item) => {
      const unitPrice = (item.price ?? item.price_at_purchase ?? 0) / 100;
      const quantity = item.quantity ?? 1;
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(item.title)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${escapeHtml(quantity)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${(unitPrice * quantity).toFixed(2)}</td>
        </tr>`;
    })
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; color:#1f2937;">
      <h2 style="margin:0 0 4px;">Order #${escapeHtml(order.id)}</h2>
      <p style="margin:0 0 16px;color:#6b7280;">Status: <strong>${escapeHtml(order.status || 'pending')}</strong></p>

      <h3 style="margin:20px 0 8px;">Customer</h3>
      <p style="margin:0;">${escapeHtml(order.customer_name) || 'Not provided'}</p>
      <p style="margin:0;">${escapeHtml(order.customer_email) || 'Not provided'}</p>
      <p style="margin:0;">${escapeHtml(order.customer_phone) || 'No phone provided'}</p>

      <h3 style="margin:20px 0 8px;">Shipping Address</h3>
      <p style="margin:0;white-space:pre-wrap;">${escapeHtml(order.shipping_address) || 'No shipping address provided'}</p>

      <h3 style="margin:20px 0 8px;">Order Notes</h3>
      <p style="margin:0;white-space:pre-wrap;">${escapeHtml(order.order_notes) || 'No notes provided'}</p>

      <h3 style="margin:20px 0 8px;">Items</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #ddd;">Item</th>
            <th style="padding:8px;text-align:center;border-bottom:2px solid #ddd;">Qty</th>
            <th style="padding:8px;text-align:right;border-bottom:2px solid #ddd;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows || '<tr><td colspan="3" style="padding:8px;">No items recorded</td></tr>'}</tbody>
      </table>

      <p style="margin:16px 0 0;font-size:1.1rem;"><strong>Total: $${((order.total || 0) / 100).toFixed(2)}</strong></p>
    </div>
  `;
}

export async function sendOrderEmail(customerEmail, orderDetails) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { id, total, items, status } = orderDetails;
    const itemsList = items?.map(item => `<li>${item.title} x${item.quantity} - $${((item.price || item.price_at_purchase) / 100).toFixed(2)}</li>`).join('') || '';
    
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
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
    
    if (error) {
      throw new Error(`Resend rejected order email to ${customerEmail}: ${error.message}`);
    }

    console.log('📧 Email sent to', customerEmail, '- ID:', data?.id);
    return data;
  } catch (sendError) {
    console.error('Failed to send email:', sendError);
    throw sendError;
  }
}

export async function sendOrderSMS(phoneNumber, orderId, total) {
  // SMS disabled for now - email notifications only
  console.log('📱 SMS notification for order', orderId, '- would go to:', phoneNumber);
  return { success: true };
}

export async function sendAdminNotification(message, order = null) {
  // Email admin about new order/activity
  try {
    const { query } = await import('@/lib/db');
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const adminResult = await query('SELECT email FROM admins ORDER BY email ASC');
    const adminEmails = adminResult.rows.map((admin) => admin.email);
    const fallbackEmail = process.env.ADMIN_EMAIL;
    const recipients = adminEmails.length > 0 ? adminEmails : fallbackEmail ? [fallbackEmail] : [];

    if (recipients.length === 0) {
      throw new Error('No admin contacts available');
    }

    const subject = order
      ? `New Order #${order.id} - $${((order.total || 0) / 100).toFixed(2)}`
      : 'Goodness Gracious Gabriel - Admin Alert';

    const html = order
      ? `<p style="font-family:Arial,sans-serif;">${escapeHtml(message)}</p>${renderOrderDetailsHtml(order)}`
      : `<p>${escapeHtml(message)}</p>`;

    const results = await Promise.all(
      recipients.map(async (recipient) => {
        const { data, error } = await resend.emails.send({
          from: FROM_ADDRESS,
          to: recipient,
          subject,
          html,
        });

        if (error) {
          console.error('Failed to send admin notification to', recipient, '-', error.message);
          return { recipient, delivered: false };
        }

        return { recipient, delivered: true, id: data?.id };
      })
    );

    const delivered = results.filter((result) => result.delivered);
    console.log('📩 Admin notification delivered to', delivered.length, 'of', recipients.length, 'admin(s)');

    if (delivered.length === 0) {
      throw new Error('Unable to deliver admin notification to any recipient');
    }

    return results;
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(customerEmail, resetUrl, customerName) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
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

    if (error) {
      throw new Error(`Resend rejected password reset email to ${customerEmail}: ${error.message}`);
    }

    console.log('📧 Password reset email sent to', customerEmail, '- ID:', data?.id);
    return data;
  } catch (sendError) {
    console.error('Failed to send password reset email:', sendError);
    throw sendError;
  }
}
