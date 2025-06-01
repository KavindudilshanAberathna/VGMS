const nodemailer = require('nodemailer');
const ejs = require('ejs');
const pdf = require('html-pdf');
const path = require('path');
const juice = require('juice');

const sendInvoiceEmail = async ({ customer, mechanic, appointment, transaction, duration }) => {
  const templatePath = path.join(__dirname, '../views/transactions/invoice.ejs');

  // Render EJS to HTML
  const html = await ejs.renderFile(templatePath, {
    customer, mechanic, appointment, transaction, duration
  });

  // Inline CSS for email compatibility
  const inlinedHTML = juice(html);

  // Convert HTML to PDF (keep original HTML, not inlined)
  const pdfBuffer = await new Promise((resolve, reject) => {
    pdf.create(html).toBuffer((err, buffer) => {
      if (err) reject(err);
      else resolve(buffer);
    });
  });

  console.log('Customer email:', customer?.email);

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
  });

  // Send email
  await transporter.sendMail({
    from: '"VGMS" <vgmsgarage@gmail.com>',
    to: customer.email,
    subject: `Invoice for Your Recent Service - ${transaction.serviceType}`,
    text: `Hello ${customer.name},\n\nAttached is the invoice for your recent ${transaction.serviceType} service.\n\nThank you!`,
    html: inlinedHTML,
    attachments: [{
      filename: 'invoice.pdf',
      content: pdfBuffer
    }]
  });

  console.log('Invoice email sent to:', customer.email);
};

module.exports = sendInvoiceEmail;
