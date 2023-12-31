var locale = process.env.LOCALE || 'en';

module.exports = {
  en:{
    auth:{
      unable: 'Unable to process your request',
      change: 'Current password is incorrect',
      invalid: {
        password: 'Password doesn\'t meet criteria'
      },
      reg:{
        taken: 'This email address is already registered',
        mismatch: 'Passwords do not match',
        invalid: 'Enter a valid email and password'
      },
      log:{
        wrong: 'Wrong credentials. Try again',
        token: 'missing token',
        notfound: 'This email address is not registered, please contact <a href="mailto:ruptivehelpdesk@indigoslate.com?subject=Trouble with login&body=I need help logging in"><u>helpdesk</u></a>'
      }
    }
  }
}[locale]
