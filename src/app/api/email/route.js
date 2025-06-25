import nodemailer from 'nodemailer';
console.log(process.env.EMAIL_USER);

export async function POST(req) {
    console.log(process.env.EMAIL_USER);

  try {
    const { to, subject, text, html, designImage, designUpload } = await req.json();
console.log(to);
console.log(process.env.EMAIL_USER);

    // Configure your SMTP provider here (example: Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // set in .env.local
        pass:process.env.EMAIL_PASS, // set in .env.local
      },
    });

    const attachments = [];
    if (designImage) {
      attachments.push({
        filename: 'tshirt-design.png',
        content: designImage.split(',')[1],
        encoding: 'base64',
      });
    }
    if (designUpload) {
      attachments.push({
        filename: 'uploaded-design.png',
        content: designUpload.split(',')[1],
        encoding: 'base64',
      });
    }

    const mailOptions = {
      from:'abdelrahmanelnobby@gmail.com',
      to,
      subject,
      text,
      html,
      attachments,
    };

    await transporter.sendMail(mailOptions);
    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 