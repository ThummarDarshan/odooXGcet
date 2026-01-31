require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
    console.log('Testing email sending...');
    console.log('User:', process.env.SMTP_USER);
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('Secure:', process.env.SMTP_SECURE);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        debug: true,
        logger: true,
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: process.env.SMTP_USER, // Send to self
            subject: 'Test Email from Shiv Furniture Backend',
            text: 'If you receive this, email configuration is working.',
        });
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error occurred while sending email:');
        console.error(error);
    }
}

main();
