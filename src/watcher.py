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
def get_active_window_title():
    """Get window title using pyatspi."""
    try:
        desktop = pyatspi.Registry.getDesktop(0)
        for app in desktop:
            if app is None:
                continue
            try:
                for i in range(app.childCount):
                    child = app.getChildAtIndex(i)
                    if child and child.getState().contains(pyatspi.STATE_ACTIVE):
                        return child.name
            except Exception:
                continue
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


def format_duration(secs):
    if secs < 60:
        return f"{secs}s"
    elif secs < 3600:
        return f"{secs // 60}m {secs % 60}s"
    else:
        return f"{secs // 3600}h {(secs % 3600) // 60}m"
last_app = None
last_title = None
last_start = time.time()
while True:
    try:
        app_name = get_focused_app()
        window_title = get_active_window_title()
        #browser_page = get_active_browser_url()
        now = time.time()
        
        duration = round(now - last_start)
        if app_name and (app_name != last_app or window_title != last_title):
            # App switched — emit the previous session
            if last_app is not None and duration > 3:
                event = {
                    "app": last_app,
                    "duration": format_duration(duration),
                    "durationSecs": duration,
                    "windowTitle": last_title or "",
                    "timestamp": time.strftime("%d %b %Y %H:%M:%S", time.localtime()),
                }
                print(json.dumps(event), flush=True)

            last_app = app_name
            last_title =window_title
            last_start = now

        time.sleep(1)

    except KeyboardInterrupt:
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)
        time.sleep(1)