const AWS = require('./aws');

module.exports = (params) => {
  let ses = new AWS.SES({apiVersion: '2010-12-01'})

  if(params.notify){
    let charset  = 'UTF-8'

    let bodyText = `This is to notify that ${params.inviter.email}, has assigned you new task in "${params.inviteNode}" Project. For more information click <a href="${params.origin}">link</a>
    if this link is not working then copy and paste this URL "<b>${params.origin}</b>" into your browser.

    <br><br>For help logging in, please contact the Ruptive Helpdesk <a href="mailto:ruptivehelpdesk@indigoslate.com">ruptivehelpdesk@indigoslate.com</a>

    <br><br>This email is sent by Indigo Slate | Ruptive Platform.`

    let subject  = `Indigo Slate | Ruptive Project Notification: Task Assigned in ${params.inviteNode} Project`
    let mailParams = {
      Destination: {
        CcAddresses: [],
        ToAddresses: params.email
      },
      Message: {
        Body: {
          Html: {
          Charset: charset,
          Data: bodyText
          },
          Text: { Charset: charset, Data: bodyText }
        },
        Subject: { Charset: charset, Data: subject }
        },
      Source: `On behalf of ${params.inviter.firstname || ''} ${params.inviter.lastname || ''} <system@ruptive.cx>`,
      ReplyToAddresses: [
          'no-reply@ruptive.cx',
      ],
    };
    return ses.sendEmail(mailParams).promise();
  }

  else {
    let charset  = 'UTF-8'

    let bodyText = `On behalf of ${params.inviter.email}, you are invited to join the "${params.inviteNode.title}" workshop at <a href="${params.origin}">${params.origin}</a>.

    <br><br>For help logging in, please contact the Ruptive Helpdesk <a href="mailto:ruptivehelpdesk@indigoslate.com">ruptivehelpdesk@indigoslate.com</a>

    <br><br>This email is sent by Indigo Slate | Ruptive Platform.`

    let subject  = `Indigo Slate | Ruptive: Invite to ${params.inviteNode.title} Workshop`
    let mail1Params = {
      Destination: {
        CcAddresses: [
          params.inviter.email
        ],
        BccAddresses: params.email,
        ToAddresses: ['attendees@ruptive.cx']
      },
      Message: {
        Body: {
          Html: {
          Charset: charset,
          Data: bodyText
          },
          Text: { Charset: charset, Data: bodyText }
        },
        Subject: { Charset: charset, Data: subject }
        },
      Source: `On behalf of ${params.inviter.firstname || ''} ${params.inviter.lastname || ''} <system@ruptive.cx>`,
      ReplyToAddresses: [
          'no-reply@ruptive.cx',
      ],
    };


    let mail2Params = {
      Destination: {
        ToAddresses: [params.inviter.email]
      },
      Message: {
        Body: {
          Html: {
            Charset: charset,
            Data: params.email.join('<br>')
          },
          Text: { Charset: charset, Data: params.email.join('\r\n') }
        },
        Subject: { Charset: charset, Data: `Workshop Attendees - ${params.inviteNode.title}` }
        },
      Source: `Ruptive Workshop Facilitator <system@ruptive.cx>`,
      ReplyToAddresses: [
        'no-reply@ruptive.cx',
      ],
    };

    return Promise.all([
      ses.sendEmail(mail1Params).promise(),
      ses.sendEmail(mail2Params).promise()
    ])
  }
}
