const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
  host: 'smtp.fastmail.com',
  port: 587,
  secure: false, // use SSL
  auth: {
    user: 'examinedpanic8@fastmail.com', // Use your custom email address
    pass: 'wql33khk9ja27ga8', // Use your email password
  },
});

module.exports = transport;
