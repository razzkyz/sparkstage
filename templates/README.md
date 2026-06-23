# Email & Message Templates

Collection of email and message templates for various user communications.

## Contents

### Supabase Auth Templates
- `SUPABASE_RESET_PASSWORD_TEMPLATE.html` - Password reset email template

## Supabase Email Templates

### Password Reset Template

Custom HTML template for password reset emails sent via Supabase Auth.

**Configuration:**
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Select "Reset Password" template
3. Replace default template with content from `SUPABASE_RESET_PASSWORD_TEMPLATE.html`

**Features:**
- Custom branding for SparkStage
- Responsive design
- Clear call-to-action button
- Professional styling

## Template Structure

Email templates should include:
- Clear subject line
- Branded header
- Main message content
- Action button/link
- Footer with company info
- Unsubscribe/privacy links

## Future Templates

Consider adding:
- Welcome email template
- Order confirmation template
- Ticket purchase confirmation
- Booking reminder template
- Invoice email template

## Usage

Templates can be used in:
- **Supabase Auth** - Authentication emails
- **Edge Functions** - Custom email sending
- **WhatsApp Messages** - Message formatting
- **System Notifications** - Admin alerts
