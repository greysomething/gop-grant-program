import { EmailTemplate } from '@/api/entities';
import { SendEmail } from '@/api/integrations';

/**
 * Fetches an email template, populates it with variables, and sends it.
 * @param {string} templateKey - The unique key for the email template.
 * @param {string} recipientEmail - The email address of the recipient.
 * @param {object} variables - A key-value object of variables to replace in the template.
 */
export const sendTemplatedEmail = async (templateKey, recipientEmail, variables) => {
  try {
    // 1. Fetch the template from the database
    const templates = await EmailTemplate.filter({ template_key: templateKey, is_active: true });
    
    if (templates.length === 0) {
      console.error(`Email template with key "${templateKey}" not found or is inactive.`);
      return;
    }
    
    const template = templates[0];
    let { subject, body_html } = template;

    // 2. Populate the template with variables
    for (const key in variables) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, variables[key]);
      body_html = body_html.replace(regex, variables[key]);
    }

    // 3. Send the email using the integration
    await SendEmail({
      to: recipientEmail,
      subject: subject,
      body: body_html,
      from_name: 'Gift of Parenthood'
    });
    
    console.log(`Successfully sent email with template "${templateKey}" to ${recipientEmail}`);

  } catch (error) {
    console.error(`Failed to send email for template "${templateKey}":`, error);
  }
};