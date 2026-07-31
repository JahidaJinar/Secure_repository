const nodemailer = require('nodemailer');

class EmailService {
  getTransporter() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = process.env.SMTP_PORT || 587;

    if (user && pass) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port == 465,
        auth: { user, pass }
      });
    }
    return null;
  }

  async sendAccessRequestEmail(authorEmail, requesterEmail, projectTitle) {
    const transporter = this.getTransporter();
    const subject = `📩 New Access Request for Project: ${projectTitle}`;
    const text = `Hello Author,\n\nUser (${requesterEmail}) has requested access to decrypt your project "${projectTitle}".\n\nPlease log in to your Author Dashboard to review and approve/reject this request.\n\nBest regards,\nEdTech Secure Project Repository`;

    if (transporter) {
      try {
        await transporter.sendMail({
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
    const transporter = this.getTransporter();
    const subject = `✅ Access Approved for Project: ${projectTitle}`;
    const text = `Hello,\n\nGood news! Author (${authorEmail}) has APPROVED your access request for "${projectTitle}".\n\nYou can now log in to the EdTech Repository, open your Dashboard or Project page, and click "Decrypt & Download".\n\nRemember to obtain the secret decryption password from the author.\n\nBest regards,\nEdTech Secure Project Repository`;

    if (transporter) {
      try {
        await transporter.sendMail({
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

  async sendRejectionNotificationEmail(requesterEmail, projectTitle, authorEmail) {
    const transporter = this.getTransporter();
    const subject = `❌ Access Request Declined for Project: ${projectTitle}`;
    const text = `Hello,\n\nAuthor (${authorEmail}) has DECLINED your access request for "${projectTitle}".\n\nIf you believe this was in error, please reach out to the project author directly.\n\nBest regards,\nEdTech Secure Project Repository`;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"EdTech Repository" <${process.env.SMTP_USER}>`,
          to: requesterEmail,
          subject,
          text
        });
        console.log(`✉️ Rejection notification email sent to requester: ${requesterEmail}`);
      } catch (err) {
        console.error(`⚠️ Error sending email to ${requesterEmail}:`, err.message);
      }
    } else {
      console.log(`[SIMULATED EMAIL] To: ${requesterEmail} | Subject: ${subject}`);
    }
  }

  async sendPasswordResetLinkEmail(userEmail, resetLink) {
    const transporter = this.getTransporter();
    const subject = `🔑 Password Reset Link - EdTech Repository`;
    const text = `Hello,\n\nWe received a request to reset your password for EdTech Secure Project Repository (${userEmail}).\n\nPlease click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request a password reset, please ignore this email.\n\nBest regards,\nEdTech Secure Project Repository`;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"EdTech Repository" <${process.env.SMTP_USER}>`,
          to: userEmail,
          subject,
          text
        });
        console.log(`✉️ Password reset link email sent to: ${userEmail}`);
      } catch (err) {
        console.error(`⚠️ Error sending password reset email to ${userEmail}:`, err.message);
      }
    } else {
      console.log(`[SIMULATED EMAIL] To: ${userEmail} | Subject: ${subject} | Link: ${resetLink}`);
    }
  }
}

module.exports = new EmailService();
