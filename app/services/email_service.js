const sgMail = require('@sendgrid/mail')
const config = require('config');
sgMail.setApiKey(process.env.SENDGRID_API_KEY || config.get('SENDGRID_API_KEY'))

const path = require('path');
const fs = require("fs");

exports.sendVerificationEmail = (email, user, secret) => {
  console.log("emailing: ", email, secret)

  const msg = {
    to: email, // Change to your recipient
    from: 'no-reply@funkyradish.com', // Change to your verified sender
    templateId: 'd-e86cd153fca84ba5bacadc6654513fdd',
    dynamicTemplateData: {
      "secret": secret,
      "user": user
    },
    subject: 'Confirm your FunkyRadish registration'
  }

  return sgMail.send(msg)
}

exports.sendPasswordResetEmail = (email, secret) => {
  console.log("emailing: " + email + ", secret: "+ secret)

  const msg = {
    to: email, // Change to your recipient
    from: 'no-reply@funkyradish.com', // Change to your verified sender
    templateId: 'd-e86cd153fca84ba5bacadc6654513fdd',
    dynamicTemplateData: {
      "sender_secret": secret,
      "sender_email": email
    },
    subject: 'Reset your FunkyRadish password.'
  }

  return sgMail.send(msg)
}
