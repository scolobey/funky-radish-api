const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const path = require('path');
const fs = require("fs");

exports.sendVerificationEmail = (email, user, secret) => {
  console.log("emailing", email, secret)

  const msg = {
    to: email, // Change to your recipient
    from: 'no-reply@funkyradish.com', // Change to your verified sender
    templateId: 'd-041eb47115154e338d21854457cc1750',
    dynamicTemplateData: {
      "sender_secret": secret,
      "user": user
    },
    subject: 'Confirm your FunkyRadish registration'
  }

  return sgMail.send(msg)
}


exports.forwardPublicKey = (email, key) => {
  console.log("Emailing public key: " + email)

  const msg = {
    to: email, // Change to your recipient
    from: 'no-reply@funkyradish.com', // Change to your verified sender
    subject: 'New Public Key!',
    text: key
  }

  return sgMail.send(msg)
}
