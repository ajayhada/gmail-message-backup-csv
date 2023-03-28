# Follow instruction to setup the and run

1. Before running this program, you need to download the client_secret.json file from the Google Cloud Console and save it in the same directory as the program. You also need to create an empty token.json file in the same directory to store the OAuth2 token.
   
     To use the Gmail API with an API key, you need to enable the "Gmail API" in the Google Cloud Console and create an API key with the appropriate permissions. Here are the steps to create an API key with the necessary permissions:

   1. Go to the Google Cloud Console (console.cloud.google.com)
   2. Create a new project or select an existing project
   3. Enable the "Gmail API" in the API library for your project
   4. Create OAuth 2.0 credentials for your app in the "Credentials" section of your project
   5. Download the JSON file for your OAuth 2.0 client ID by clicking the "Download" button next to the client ID
   6. Save the JSON file to your computer and rename it to auth.json


2. To run this program, open a terminal or command prompt in the directory where you saved the files and run `npm install googleapis fs readline csv-writer` to install the required dependencies. 
3.  Then, run `node index.js` to run the program. The program will prompt you to visit a URL to authorize the app, open the url, login to your gmail account, authorize the request, after authorization it will redirect to http://localhost url with code, you need to copy and paste the code in terminal to complete the authorization process. Once authorized you can run the program again to start the process. 

