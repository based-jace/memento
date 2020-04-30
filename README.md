# memento
#### User/admin file-storage web app built with Flask, Vue, and GCP (Firestore and Google Cloud Storage).

[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

Working demo at [memento.jacemedlin.xyz](https://memento.jacemedlin.xyz).

### Demo Credentials:

admin:
* username: billtest@test.com
* password: password123

regular user:
* username: petetest@test.com (Beatles reference?)
* password: password123

## About
memento is a user/admin file-storage app built with Flask, Vue, and GCP (Firestore and Google Cloud Storage).

## How to Run memento
To run your own instance of memento, you're going to need a Google account to set up a [Firebase](https://console.firebase.google.com/) project.

## Walkthrough
### Step 0. Install [git](https://git-scm.com/) and [Python3](https://www.python.org/downloads/)
### Step 1. Cloning the Repo
Once you have git installed, you're going to need to clone the repository.

1. First, open a terminal in your directory of choice. 
2. Type `git clone https://github.com/based-jace/memento.git` and press "Enter." This creates a copy of the source code on your machine.
3. `cd` into your new directory. If you didn't set your own, the new folder should be `memento`.

### Step 2. Setting Up Firebase
1. In your browser of choice, go to https://console.firebase.google.com/ and click "Add project."
2. Give your project a name.
3. Keep following the onscreen instructions until it redirects you to the overview page. The URL should look something like: `https://console.firebase.google.com/u/0/project/{{ YOUR-PROJECT-ID-HERE }}/overview`
4. In the top-left corner, next to "Project Overview," there should be a gear. Click it, then click on the first dropdown item: "Project settings."
5. Go to the "Service Accounts" tab. Generate a new private key (by clicking the button that says "Generate new private key"), then click on "Generate key". This file allows the app to interact with Firebase on your behalf.
6. Cut or copy the generated JSON file. We're going to put this in a place reachable by our project.
7. In your file explorer, go to the folder where you cloned the repo. In that folder, go into `backend`, then `api`. Paste the JSON file here. Rename it `firebase_creds.json`.

We're also going to need a JavaScript client-side configuration.

8. Back in the Firebase console, click the "Project overview" button. Add a web app. 
The button should look something like `</>`.
9. Give your app a nickname and register it.

The next section should have a couple of script tags. The first one is the core Firebase SDK. We don't need this, because it's already linked in the app. 

10. Copy the contents of the second script tag. This config enables us to interact with Firebase on the front-end.
11. Back in file explorer, from `{{ project_name }}/backend/api`, go down to `static/js/firebase_stuff.js` and open it in your favorite text editor.
12. Replace lines 1-4 with the config we copied from the Firebase console.

Let's create a couple of users.

13. Go to the "Authentication" screen. Click "Set up sign-in method." Enable the Email/Password provider. Go back to the "Users" tab. Click "Add user." Give them an email address and password, then click "Add user." Create one more user.

We're creating two users so we can set up a regular user and an admin.

Next, let's create the database. This is going to hold all of our users' attributes, including preferred language, first/last name, etc.

14. In your project's Firebase console, click "Database," then "Create database." Click "Start in test mode," "Next," and finally "Done." 

**Note:** This is very insecure. Anyone will be able to access your database. Later on, you should change these security rules, but right now, as a demo, this should be fine.

15. Click "Start Collection" and name your new collection "demo-user". 

Each user's document id must match the user's authentication uid.

Each user document must also contain no less than 7 specific fields:
* first_name: string
* last_name: string
* phone: string
* email: string (this should match the user's registered auth email address)
* preferred_language: string (this should be a two-character language code)
* vid: string (a 5-digit unique code)
* is_admin: boolean (denotes whether the user is an admin or not)

Supported languages:
* de: Deutsch
* en: English
* es: Español

Create an admin and a non-admin with the auth credentials we created earlier.

Next, let's set up our cloud storage.

16. Go to the "Storage" page using the left-side navigation. Click "Get started," then "Next." Click "Done."

**Note:** Again, this is insecure. Although all of these files will be encrypted, it's still worth changing the rules to make attaining the files more difficult.

### Step 3. Creating a Master Key
Since memento has an encryption system for file security, we're going to need to create a master key. 

1. In your terminal, go back to `{{ project_name }}/backend/api` and run `python generate_master_key.py`. This key is going to be a base64-coded key that gets decoded in our app.

### Step 3.5. OPTIONAL: Create a Virtual Environment
Creating a virtual environment for each of your projects is a great practice, because it keeps everything modular. This way your dependencies and global libraries don't all crash together. Trust me, that sucks.

1. In your terminal, go back up to your project's root folder (`{{ project_name }}`). Type `python -m venv env`. You may also replace '`env`' with whatever you would prefer your virtual environment be called. 
2. Run `{{ env }}/Scripts/activate`. This starts your virtual environment.

! From now on, whenever you want to run or add new dependencies to your project, you'll want to run `{{ env }}/Scripts/activate` from whatever terminal you're using. Using Python with [Visual Studio Code](https://code.visualstudio.com/) makes this even easier, as it will allow you to quickly instantiate new terminals that automatically open your virtual environment. !

### Step 4. Server-Side Config Modification
1. In your file explorer, go back to `{{ project_name }}/backend/api`. Open `config.json` in your text editor.
2. Change `SECRET_KEY`'s value to something better.
3. Change `BUCKET`'s value to `"{{ Firebase project's id }}.appspot.com"`. You can find your project id in your project's Firebase console URL: `https://console.firebase.google.com/u/0/project/**{{ YOUR-PROJECT-ID-HERE }}**/overview.`

This will be the URL from which we'll connect to our cloud storage bucket.

### Step 5. Installing Dependencies
1. In your terminal, go back to your root folder: `{{ project_name }}`. Run `pip install -r requirements.txt`. This installs all of the necessary dependencies memento will need to run.

### Step 6. Run the app
We're almost there!

1. In your terminal, go back down to `{{ project_name }}/backend/api` and run `python api.py`.
2. Your server should now be up and running on port 5000. Go to localhost:5000, and you should be presented with the login page:

![Image of the index page](https://jacemedlin.xyz/portfolio-examples/memento.png "memento index page")

### Finish
We did it. Awesome. If you have any questions, don't hesitate to reach out.





