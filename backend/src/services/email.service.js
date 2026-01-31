const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        console.log(`Email Service Initialized: Host=${process.env.SMTP_HOST}, Port=${process.env.SMTP_PORT}, Secure=${process.env.SMTP_SECURE}`);
    }

    async sendEmail(to, subject, text, html) {
        try {
            if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.warn('SMTP credentials not found. Email not sent.');
                return null;
            }

            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"Shiv Furniture" <noreply@shivfurniture.com>',
                to,
                subject,
                text,
                html
            });
            console.log('Message sent: %s', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            return null;
        }
    }

    async sendPortalAccessEmail(email, password, name) {
        const subject = 'Welcome to Shiv Furniture Customer Portal';
        const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173/login';

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #2563eb;">Welcome, ${name}!</h2>
                <p>You have been granted access to the Shiv Furniture Customer Portal.</p>
                <p>Your account has been created with the following temporary credentials:</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
                    <p style="margin: 8px 0;"><strong>Username/Email:</strong> ${email}</p>
                    <p style="margin: 8px 0;"><strong>Temporary Password:</strong> ${password}</p>
                </div>
                <p>For security reasons, you will be required to change this password upon your first login.</p>
                <div style="margin: 30px 0; text-align: center;">
                    <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Access Customer Portal
                    </a>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #64748b; font-size: 12px;">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        `;

        const text = `Welcome, ${name}!\n\nYou have been granted access to the Shiv Furniture Customer Portal.\n\nHere are your login credentials:\nEmail: ${email}\nTemporary Password: ${password}\n\nPlease log in at: ${loginUrl}\nYou will need to change your password upon first login.`;

        return this.sendEmail(email, subject, text, html);
    }
}

module.exports = new EmailService();
