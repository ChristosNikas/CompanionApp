#!/usr/bin/env python3
# watcher.py
# Runs continuously, prints active app + window info as JSON to stdout
# Called as a child process by tracker.js

import pyatspi
import json
import time
import sys
import subprocess

def get_active_window_title():
    """Try to get the active window title via xdotool fallback or atspi."""
    try:
        result = subprocess.run(
            ['xdotool', 'getactivewindow', 'getwindowname'],
            capture_output=True, text=True, timeout=1
        )
        if result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    return None

def get_active_browser_url():
    """Try to get the active URL from Brave/Chrome/Firefox via xdotool window title."""
    try:
        result = subprocess.run(
            ['xdotool', 'getactivewindow', 'getwindowname'],
            capture_output=True, text=True, timeout=1
        )
        title = result.stdout.strip()
        # Browser titles usually end with " - Brave" or " - Google Chrome" etc.
        for browser in ['Brave', 'Google Chrome', 'Firefox', 'Chromium']:
            if f'- {browser}' in title:
                # The URL is not directly available from title alone
                # Return the page title instead
                return title.replace(f' - {browser}', '').strip()
    except Exception:
        pass
    return None

def get_scroll_activity():
    """Placeholder — scroll events require evdev or JS renderer layer."""
    return 0

def get_focused_app():
    """Get the currently focused app using pyatspi."""
    try:
        desktop = pyatspi.Registry.getDesktop(0)
        for app in desktop:
            if app is None:
                continue
            try:
                for i in range(app.childCount):
                    child = app.getChildAtIndex(i)
                    if child and child.getState().contains(pyatspi.STATE_ACTIVE):
                        return app.name
            except Exception:
                continue
    except Exception:
        pass
    return None

last_app = None
last_start = time.time()

while True:
    try:
        app_name = get_focused_app()
        window_title = get_active_window_title()
        browser_page = get_active_browser_url()
        now = time.time()

        if app_name and app_name != last_app:
            # App switched — emit the previous session
            if last_app is not None:
                duration = round(now - last_start)
                event = {
                    "app": last_app,
                    "durationSecs": duration,
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "windowTitle": window_title or "",
                    "browserPage": browser_page or "",
                    "scrollEvents": get_scroll_activity(),
                }
                print(json.dumps(event), flush=True)

            last_app = app_name
            last_start = now

        time.sleep(5)

    except KeyboardInterrupt:
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)
        time.sleep(5)