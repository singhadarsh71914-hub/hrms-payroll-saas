import { emailService } from '../src/services/email.service';

async function run() {
  try {
    // Access the private transporter to verify it
    const transporter = (emailService as any).transporter;
    if (transporter) {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } else {
      console.log('No transporter initialized');
    }
  } catch (error) {
    console.error('SMTP Error:', error);
  }
}

run();
