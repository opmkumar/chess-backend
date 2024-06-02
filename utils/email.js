const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  //1)Create a transporter

  const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  //2)Define email options

  const mailOptions = {
    from: "KUMAR ANIKET <aniket@gmail.com>",
    to: options.to,
    subject: options.subject,
    text: options.message,
  };

  //3) Send mail

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
