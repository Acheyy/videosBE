const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
  host: 'smtp.fastmail.com',
  port: 587,
  secure: false, // use SSL
  auth: {
    user: 'contact@skbj.tv', // Use your custom email address
    pass: 'dweuzwvgsc7apxqn', // Use your email password
  },
});

module.exports = transport;
