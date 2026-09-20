# Building a Roomba ops dashboard

Hardware without a UI is just LEDs blinking in a closet.

I built a live ops dashboard for a DIY Roomba stack: dock status, run history, map and camera views, and controls — the kind of screen you'd want if you were the operator, not the hobbyist staring at ROS topics.

## Stack

- Next.js + TypeScript for the dashboard
- ROS 2 / Raspberry Pi on the robot side
- Mock mode so the UI is developable when the bot is offline

## What I cared about

- **Status first** — battery, state, connection before fancy charts
- **Actions that match reality** — start, stop, dock
- **Map + camera** — situational awareness, not just numbers
- **History** — runs with coverage so you can tell if a "clean" did anything

## Why it helps hiring

This is hardware-adjacent software: APIs, realtime-ish status, and an operator UI. If your team bridges robots and web, this is the muscle I want to keep building.
