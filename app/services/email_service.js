const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

exports.sendVerificationEmail = (email, user, secret) => {
  console.log("emailing", email, secret)

  const msg = {
    to: 'minedied@gmail.com', // Change to your recipient
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
