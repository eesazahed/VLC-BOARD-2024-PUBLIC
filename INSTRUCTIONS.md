## Setup:

- Be a VLC student
- You should have a basic understanding of JavaScript and GitHub
- You need approval from student council and the principal
- Once that is done, begin working on the site
- The code in this repo should be good to work with
- Clone the repo on your local machine
- Setup the enviroment variables
- You will need to create two MongoDB databases -- this is free (as of dec 2024)
- You will probably understand setting up a MongoDB database better with a YouTube tutorial
- Make sure that in network settings, you allow access from anywhere
- You will need to copy the connection strings into .env
- Now create your own HASH, JWT, and AUTH keys. They are random pharases like "THIS_IS_VERY_SECRET_123"
- Run `npm install` and all the packages will be installed.

## Next, set up the authentication system:

- Create a Google Form on your VLC account
- The form should only allow one submission
- The form should be locked to only allow TLDSB students to access it
- Collect email addresses (required)
- Link the form to a Google sheets spreadsheet.
- Run an AppScript on the spreedsheet by clicking Extensions --> Appscript on the top menu
- See the file in this repo called Code.js? Copy and paste that into the editor on Google Appscript.
- Edit the Authorization header. "THIS_IS_VERY_SECRET" should be replaced with whatecver is in your .env file for AUTH_KEY
- Go to triggers --> Add trigger and select event source --> From spreadsheet
- Select event type --> On form submit
- Now every time a student fills out the form, they should recieve a login code in their email.

## Hosting:

- The student must figure out a way to host the site
- The easiest option is to use Replit but that costs $25 (as of dec 2024)
- Once on Replit, just upload your code and set the environment variables.
- Go into ./index.js and search `isCanvasDay`
- By default, `isCanvasDay` is false, you will need to set it to true when Canvas Day starts.
- You will then need to set it to false again when Canvas Day ends

Please note that if anything unexpected happens, it is your responsibility to resolve the issue.
