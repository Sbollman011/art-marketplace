import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendOrderEmail(customerEmail, orderDetails) {
  try {
    const { id, total, items, status } = orderDetails;
    
    console.log('📧 Order confirmation email would be sent to:', customerEmail);
    console.log('Order ID:', id);
    console.log('Total:', (total / 100).toFixed(2));
    console.log('Status:', status);
    
    // In production, integrate with SendGrid, Resend, or AWS SES
    // For now, we just log it
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendOrderSMS(phoneNumber, orderId, total) {
  try {
    const message = await twilioClient.messages.create({
      body: `Your art order #${orderId} for $${(total / 100).toFixed(2)} has been confirmed! Thank you!`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log('SMS sent:', message.sid);
    return message;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw error;
  }
}

export async function sendAdminNotification(message) {
  // Email admin about new order/activity
  try {
    console.log('📩 Admin notification:', message);
    // In production, send actual email
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
}
