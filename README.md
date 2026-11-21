# Placecard

Placecard is an event invitation and RSVP platform. Organisers can
create events, manage guest lists, send invitations, and track
responses. Guests can open their personal invitation links and respond
to events.

## Features

-   User registration and sign-in
-   Google sign-in and password reset
-   Event creation, editing, and publishing
-   Guest list management
-   Personal invitation links
-   Invitation emails and email activity logs
-   RSVP responses, including attendee counts
-   Event capacity handling
-   RSVP and attendance overview
-   Admin dashboard for managing events and guests
-   Guest portal for viewing invitations
-   Profile and account settings

## Tech stack

**Frontend:** React 18, Vite, React Router\
**Backend:** Node.js, Express\
**Authentication and database:** Firebase Authentication, Cloud
Firestore\
**Email delivery:** Resend\
**Deployment setup:** Netlify for the frontend and Render for the
backend

## Project structure

``` text
placecard/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       │   └── admin/
│       ├── styles/
│       ├── App.jsx
│       ├── api.js
│       ├── firebase.js
│       └── main.jsx
└── server/
    └── ...
```

## Getting started

### Requirements

-   Node.js (LTS recommended)
-   npm
-   A Firebase project with Authentication and Cloud Firestore
    configured
-   A Resend account, if you want to send invitation emails

### 1. Clone the repository

``` bash
git clone <your-repository-url>
cd placecard
```

### 2. Install dependencies

Install the frontend dependencies:

``` bash
cd client
npm install
```

Install the backend dependencies:

``` bash
cd ../server
npm install
```

### 3. Configure environment variables

Create the environment files required by the frontend and backend.

-   Add your Firebase web app configuration to the frontend environment
    file.
-   Add the backend Firebase Admin credentials, Resend API key, sender
    address, and frontend URL to the server environment file.
-   Use the exact variable names referenced in the project's code and
    existing environment configuration.

Do not commit `.env` files, private keys, or API secrets to Git.

### 4. Start the backend

From the `server` directory, run the development command listed in
`server/package.json`. If the project defines a `dev` script:

``` bash
npm run dev
```

### 5. Start the frontend

Open a second terminal:

``` bash
cd client
npm run dev
```

Open the local URL printed by Vite.

## Email configuration

Placecard uses Resend to send invitation emails.

To send emails to arbitrary guest addresses, configure a sender address
on a domain verified with Resend. The sender address must match the
verified domain. Resend's test sender is limited and is intended for
testing.

Keep the Resend API key on the backend. Never expose it in frontend code
or commit it to the repository.

## Firebase configuration

Placecard uses Firebase Authentication for user accounts and Cloud
Firestore for application data.

Before running the app, make sure:

-   The sign-in methods used by the app are enabled in Firebase
    Authentication.
-   The frontend Firebase configuration points to the correct Firebase
    project.
-   The backend has the Firebase Admin credentials it requires.
-   Firestore rules and backend authorization checks are configured for
    your deployment.

Never publish Firebase service-account private keys.

## Deployment

### Frontend

Build the frontend from the `client` directory:

``` bash
npm run build
```

Deploy the generated `client/dist` directory to your frontend hosting
provider. Configure the host to serve the React app entry point for
client-side routes.

### Backend

Deploy the Node.js app from the `server` directory. Add the required
environment variables in the hosting provider's dashboard, configure the
production frontend origin, and point the frontend API URL to the
deployed backend.

After deployment, test sign-in, event creation, invitation links, RSVP
submission, and email delivery.

## Security

-   Keep `.env` files out of version control.
-   Rotate API keys or credentials that may have been exposed.
-   Keep Resend and Firebase Admin secrets on the server.
-   Restrict database access and validate permissions on the backend.
-   Use HTTPS in production.

## Useful commands

``` bash
# Frontend
cd client
npm run dev
npm run build
```

Check `client/package.json` and `server/package.json` for the exact
scripts available in your copy of the project.

## License

Add your chosen license here before publishing or distributing the
project.
