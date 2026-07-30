const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = process.env.SMTP_PORT || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port == 465,
        auth: { user, pass }
      });
      console.log('✅ Nodemailer SMTP Transporter initialized successfully.');
    } else {
      console.log('ℹ️ SMTP credentials not set in .env. Email Service operating in simulation log mode.');
    }
  }

  async sendAccessRequestEmail(authorEmail, requesterEmail, projectTitle) {
    const subject = `📩 New Access Request for Project: ${projectTitle}`;
    const text = `Hello Author,\n\nUser (${requesterEmail}) has requested access to decrypt your project "${projectTitle}".\n\nPlease log in to your Author Dashboard to review and approve/reject this request.\n\nBest regards,\nEdTech Secure Project Repository`;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"EdTech Repository" <${process.env.SMTP_USER}>`,
          to: authorEmail,
          subject,
          text
        });
        console.log(`✉️ Access request email sent to author: ${authorEmail}`);
      } catch (err) {
        console.error(`⚠️ Error sending email to ${authorEmail}:`, err.message);
      }
    } else {
      console.log(`[SIMULATED EMAIL] To: ${authorEmail} | Subject: ${subject}`);
    }
  }

  async sendApprovalNotificationEmail(requesterEmail, projectTitle, authorEmail) {
    const subject = `✅ Access Approved for Project: ${projectTitle}`;
    const text = `Hello,\n\nGood news! Author (${authorEmail}) has APPROVED your access request for "${projectTitle}".\n\nYou can now log in to the EdTech Repository, open your Dashboard or Project page, and click "Decrypt & Download".\n\nRemember to obtain the secret decryption password from the author.\n\nBest regards,\nEdTech Secure Project Repository`;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"EdTech Repository" <${process.env.SMTP_USER}>`,
          to: requesterEmail,
          subject,
          text
        });
        console.log(`✉️ Approval notification email sent to requester: ${requesterEmail}`);
      } catch (err) {
        console.error(`⚠️ Error sending email to ${requesterEmail}:`, err.message);
      }
    } else {
      console.log(`[SIMULATED EMAIL] To: ${requesterEmail} | Subject: ${subject}`);
    }
  }
}

module.exports = new EmailService();
