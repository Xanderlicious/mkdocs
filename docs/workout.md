# Workout Timer

![Workout Timer logo](images/workout.png)

A static multi-page workout app hosted internally via nginx on Phobos. Acts as a personal workout hub with a guided interval timer and a gym exercise reference. Internal access only — not exposed externally via Traefik.

**URL:** `workout.[internal]`  
**Host:** Phobos

---

## Pages

| Path | File | Description |
| ---- | ---- | ----------- |
| `/` | `workout-index.html` | Landing page — links to both workout pages |
| `/bellyfat` | `workout-bellyfat.html` | Guided interval timer for belly fat exercises |
| `/total` | `workout-total.html` | Gym exercise reference with animated GIF demonstrations |

### Belly Fat Timer (`/bellyfat`)

Guides through a fixed sequence of exercises. Each exercise runs for **45 seconds** followed by a **30-second rest**. An audible beep signals the transition between phases.

Exercise sequence: Jumping Jacks → Knee Sit Ups → Plank → Bicycle Crunches → Flutter Kicks → Crunch Kicks

### Total Workout (`/total`)

A checklist-style gym reference page. Each exercise has an inline animated GIF demonstration (from `workout-gifs/`). Exercises can be ticked off as done; completed ones fade out.

Exercise list: Squats, Romanian Deadlifts, DB Overhead Press, Incline Chest Press, Lat Pulldown (wide grip), Tricep Pushdown, Preacher Curl, Rear Delt Reverse Pec Deck, Hammer Curls, Calf Raises

---

## Hosting

Served as static files by the [nginx](nginx.md) container. No backend or build step — changes to any file take effect immediately without an nginx reload.

### nginx server block

```nginx
server {
    listen 80;
    server_name workout.[internal];

    location = /bellyfat {
        root  /usr/share/nginx/html;
        try_files /workout-bellyfat.html =404;
    }

    location = /total {
        root  /usr/share/nginx/html;
        try_files /workout-total.html =404;
    }

    location / {
        root   /usr/share/nginx/html;
        index  workout-index.html;
        try_files $uri $uri/ /workout-index.html;
    }
}
```

### File locations

| File | Path |
| ---- | ---- |
| Landing page | `/ssd/docker/appdata/nginx/workout-index.html` |
| Belly fat timer | `/ssd/docker/appdata/nginx/workout-bellyfat.html` |
| Total workout | `/ssd/docker/appdata/nginx/workout-total.html` |
| Exercise GIFs | `/ssd/docker/appdata/nginx/workout-gifs/` (10 files) |
