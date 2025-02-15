# Spotify Controls ![Spotify Controls Logo](./icons/spotify.svg)

**Spotify Controls** is a GNOME 45+ Shell extension that integrates Spotify playback controls directly into your GNOME top bar. With this extension, you can effortlessly manage your Spotify music without leaving your workflow. It displays the Spotify logo, current artist, track title, and provides intuitive play/pause, next, and previous buttons.

## Features

- **Real-Time Track Information:** Displays the current artist and track title being played on Spotify.
- **Playback Controls:** Includes play/pause, next, and previous buttons for seamless music management.
- **Dynamic Visibility:** The indicator appears in the top bar only when Spotify is running.
- **Customizable Position:** Choose where the Spotify Controls appear in the top bar (e.g., far-left, center, far-right).
- **Volume Control via Scroll Wheel:** Adjust Spotify's volume by scrolling over the song title in the top bar.

## Screenshots

![Spotify Controls in Action](./screenshots/spotify-controls-demo.png)

*The Spotify Controls indicator displaying current track information and playback buttons in the GNOME top bar.*

## Installation

### Via [extensions.gnome.org](https://extensions.gnome.org/extension/7406/spotify-controls/)

1. **Install GNOME Shell Integration:**
   - For Firefox: Install the [GNOME Shell Integration extension](https://addons.mozilla.org/firefox/addon/gnome-shell-integration/).
   - For Chrome/Chromium: Install the [GNOME Shell Integration extension](https://chrome.google.com/webstore/detail/gnome-shell-integration/gphhapmejobijbbhgpjhcjognlahblep).

2. **Install Native Connector:**
   - Open your terminal and run:
     ```bash
     sudo apt install chrome-gnome-shell
     ```
     *Note: The package name may vary based on your Linux distribution.*

3. **Visit the Extension Page:**
   - Navigate to the [Spotify Controls Extension](https://extensions.gnome.org/extension/7406/spotify-controls/) on [extensions.gnome.org](https://extensions.gnome.org/).

4. **Toggle the Switch:**
   - Click the toggle switch to install the extension. You may be prompted to confirm the installation.

### Manually from GitHub

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Sonath21/spotify-controls.git

## Patch notes [extensions.gnome.org](https://extensions.gnome.org/extension/7406/spotify-controls/)

**Version 10**, added support for:
- Bug fixed: Spotify window bug when 'Close button should minimize the Spotify window' on the spotify client. [[1]](https://github.com/Sonath21/spotify-controls/issues/14)
- Added: Show/hide spotify icon option.
- Added: Show/hide Artist/Track info option.
- Added: Option to minimize the spotify client on second click (First click brings to foreground, second click minimizes), on the extension (in the top bar)
- Added: Middle-click on the extension, to play/pause current track option.

**Version 9**, added support for:
- Added "Volume Control via Scroll Wheel" feature - submitted by **[her0](https://github.com/Her0-GitHub)** 
- Minimise Spotify window if it's not minimized when clicking on the extension - submitted by **[AFCMS](https://github.com/AFCMS)**

**Version 8**, added support for:
- Added option to hide playback controls from the top bar
- Bug fix: the extension caused the distance between the default GNOME top bar icons to be bigger than normal.
- Bug fix: when opening spotify for the first time, sometimes the name of the artist and the song did not load correctly on fedora environments.

**Version 5**, added support for: 
- Open spotify by pressing on the extension on the top bar
- Option to move the playback controls to the left

## Contributors
- **[her0](https://github.com/Her0-GitHub)** Added: "Volume Control via Scroll Wheel" feature.
- **[AFCMS](https://github.com/AFCMS)** Added: Minimise Spotify window if it's not minimized when clicking on the extension.
