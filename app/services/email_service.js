const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

exports.sendVerificationEmail = (email, secret) => {
  console.log("emailing", email, secret)

  const msg = {
    to: 'minedied@gmail.com', // Change to your recipient
    from: 'no-reply@funkyradish.com', // Change to your verified sender
    subject: 'Confirm your FunkyRadish registration',
    text: 'Click here to confirm your account registration.',
    html: '<a href="http://localhost:8080/verify/${secret}">Click to confirm</a>',
  }

  return sgMail.send(msg)
}
