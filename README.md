# Genesys Cloud / PureCloud Status Timer

A web page that shows the current logged in users status and the time they have been in that status.

![screenshot1](https://d3d9jcb51pucvn.cloudfront.net/PureCloud_Status_Timer_Screenshot_1.png)

![screenshot2](https://d3d9jcb51pucvn.cloudfront.net/PureCloud_Status_Timer_Screenshot_2.png)


# Running the app

## Prerequisites

* A React dev environment
  * You'll want to configure the .env file with the Oauth client id you generate in PureCloud
* A secure web server
  * Once you create a build, you can upload the code to AWS S3 and then create a cloudfront distribution for the bucket if you don't have a web server or want to get this up quickly.
* A Genesys Cloud / PureCloud Org
  * You'll need to generate an Oauth app with a grant type of token implicit grant. Refer to the [Resource Center](https://help.mypurecloud.com/articles/create-an-oauth-client/) on how to configure this. You'll need to add the web server URL in the Authorized Redirect URIs field.
  * You can embed this as an app in PureCloud by adding an integration of the type Custom Client Application. Refer to the [Resource Center](https://help.mypurecloud.com/articles/set-custom-client-application-integration/) for instructions on setting this up.

## Setup

1. Clone this repo locally
2. Create an Oauth app with the Token Implicit Grant type
3. Modify the .env file to include the oauth client id you create
4. Build and Deploy to a web server
5. Create a Custom Client Integration with the URL of the web server
6. Update the Oauth app with the URL as an Authorized Redirect URI
7. Configure the Custom Client Integration Group Filtering to determine who has access 

## Using the app

1. View your status

## Troubleshooting

1. If the app is not working properly, press the refresh button
2. If the timer shows a negative time or appears to be off by more than a few seconds, ensure your computers time is correct