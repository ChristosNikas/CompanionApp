# companion-app-for-ScholarVision


Working Instructions:

# Companion App

A Linux desktop app that tracks your app usage and sends the data to your web app.

---

## Requirements

- Linux with GNOME on Wayland
- Node.js v18+
- Python 3
- Git

---

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/ChristosNikas/CompanionApp.git
cd CompanionApp

# 2. Install dependencies
npm install
sudo apt install python3-pyatspi

# 3. Create your .env file
touch .env
```

Add this to your `.env`:
```
API_URL=https://your-webapp.com/api/events
USER_TOKEN=your_secret_token
USER_ID=your_user_id
DEVICE_ID=your-device-name
```

---

## Run

```bash
npm start
```

Click **Start** to begin tracking, **Stop** when done. Data is sent automatically.

---

## Notes

- Only works on Linux with Wayland
- `.env` and `node_modules` are not included — you must create them yourself