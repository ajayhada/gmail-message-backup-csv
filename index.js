const {google} = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createArrayCsvWriter;

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// create client secret in google project and download json.
const CREDENTIALS_PATH = './client_secret.json';

// create empty file to keep auth token for future executions.
const TOKEN_PATH = './token.json';


// For example, 'INBOX' will export all emails in the inbox, 
const LABEL_NAME = 'testing';

const csvWriter = createCsvWriter({
  header: ['date', 'subject', 'snippet' , 'body'],
  path: './emails.csv', // Change this to your desired output file path
});

const authorize = async () => {

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  } catch (err) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log(`Authorize this app by visiting this URL: ${authUrl}`);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const code = await new Promise((resolve, reject) => {
      rl.question('Enter the code from that page here: ', (code) => {
        resolve(code);
      });
    });
    rl.close();

    const {tokens} = await oAuth2Client.getToken(code);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    oAuth2Client.setCredentials(tokens);
    return oAuth2Client;
  }
};

const listMessages = async (auth, nextPageToken) => {

    const gmail = google.gmail({ version: 'v1', auth: auth });
    const options = {
      userId: 'me',
      q: `label:${LABEL_NAME}`,
      maxResults: 10,
      pageToken: nextPageToken,
    };
    gmail.users.messages.list(options, async (err, res) => {
        if (err) {
          console.error('The API returned an error: ' + err);
          console.error(err);
          return;
        }
      
        // Loop through each email message ID and fetch the message data
        const messages = res.data.messages || [];
        const csvData = [];
        if (messages.length) {
          for (const message of messages) {
            console.log('fetching message.id = ' + message.id);
            const result = await getMessageData(gmail, message.id);
            const row = [
              '"' + result.dt + '"' ,
              '"' + result.subject + '"' ,
              '"' + result.snippet + '"' ,
              '"' + result.body.replace(/["']/g, "").replace(/(\r\n|\n|\r)/gm, " ") + '"' ,
            ];
            csvData.push(row);
          }
          await csvWriter.writeRecords(csvData);
          if (res.data.nextPageToken) {
            listMessages(auth, res.data.nextPageToken);
          }
        }
        
      });
};

async function getMessageData(gmail, messageId) {
  const res = await gmail.users.messages.get({ userId: 'me', id: messageId });
  const { payload } = res.data;
  const headers = {};
  // Parse the headers into a key-value object
  payload.headers.forEach((header) => {
    headers[header.name] = header.value;
  });
  //console.log(headers);
  // Get the message subject
  const subject = headers.Subject || '(no subject)';
  // get the message date
  const dt = headers.Date ;
  // Get the message body
  const body = getBodyFromPayload(payload);
  // Get the message snippet
  const snippet = res.data.snippet;
  return {dt, subject, snippet, body};
}

// Get the message body from the payload
function getBodyFromPayload(payload) {
  let body = '';
  if (payload.body && payload.body.data) {
    body = decodeMessage(payload.body.data, payload.body.attachmentId, payload.mimeType);
  } else if (payload.parts) {
    payload.parts.forEach((part) => {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        body += decodeMessage(part.body.data, part.body.attachmentId, part.mimeType);
      } else if (part.mimeType === 'multipart/alternative') {
        body += getBodyFromPayload(part);
      }
    });
  }
  return body;
}

function decodeMessage(data, attachmentId, mimeType) {
  let decodedData;
  if (attachmentId) {
    // If there is an attachment ID, fetch the attachment and decode it
    const attachment = gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: messageId,
      id: attachmentId,
    });
    decodedData = Buffer.from(attachment.data.data, 'base64').toString();
  } else {
    // Decode the data based on the specified encoding scheme
    switch (mimeType) {
      case 'text/plain':
        decodedData = Buffer.from(data, 'base64').toString();
        break;
      case 'text/html':
        decodedData = htmlToText.fromString(Buffer.from(data, 'base64').toString());
        break;
      default:
        decodedData = '';
    }
  }
  return decodedData;
}

authorize().then((auth) => {
  listMessages(auth);
});