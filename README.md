# Focusly


Working Instructions:

#Focusly

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
git clone https://github.com/ChristosNikas/Focusly.git
cd Focusly

# 2. Install dependencies
npm install
sudo apt install python3-pyatspi

## Run

```bash
npm start
```

Click **Start** to begin tracking, **Stop** when done. Data is sent automatically.

---

## Notes

- Only works on Linux with Wayland
- `.env` and `node_modules` are not included — you must create them yourself
