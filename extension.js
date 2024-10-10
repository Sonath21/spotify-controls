/*
 * Spotify Controls Extension
 * Copyright (C) 2024 Athanasios Raptis
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// Importing required GI modules using ESModules syntax
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Clutter from 'gi://Clutter';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

// Importing the base Extension class and gettext for translations
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

// Removed: const Me = Gio.File.new_for_uri(import.meta.url).get_parent().get_path();

// Debugging flag and function to control debug logging
const DEBUG = true;

/**
 * Logs debug messages to the GNOME Shell log if debugging is enabled.
 * @param {string} message - The debug message to log.
 */
function logDebug(message) {
    if (DEBUG) {
        console.log(`[Spotify Controls DEBUG]: ${message}`);
    }
}

/**
 * Logs error messages to the GNOME Shell log.
 * @param {Error} error - The error object.
 * @param {string} message - Additional context for the error.
 */
function logError(error, message) {
    console.error(`[Spotify Controls ERROR]: ${message}`, error);
}

// Define constants for Spotify's MPRIS D-Bus interface
const SPOTIFY_BUS_NAME = 'org.mpris.MediaPlayer2.spotify'; // D-Bus bus name for Spotify
const SPOTIFY_OBJECT_PATH = '/org/mpris/MediaPlayer2'; // Object path for Spotify's MPRIS interface
const MPRIS_PLAYER_INTERFACE = 'org.mpris.MediaPlayer2.Player'; // Interface for player controls
const PROPERTIES_INTERFACE = 'org.freedesktop.DBus.Properties'; // Interface for property changes

/**
 * SpotifyIndicator Class
 * Extends PanelMenu.Button to create a Spotify controls indicator in the GNOME top bar.
 */
var SpotifyIndicator = GObject.registerClass(
    class SpotifyIndicator extends PanelMenu.Button {
        /**
         * Constructor for SpotifyIndicator.
         * @param {string} extensionPath - The path to the extension's directory.
         */
        _init(extensionPath) {
            super._init(0.0, 'Spotify Controls');
            logDebug('SpotifyIndicator initialized');

            this._signalSubscriptionId = null;

            this._buildUI(extensionPath);

            this._monitorSpotifyPresence();
        }

        /**
         * Builds the user interface components of the Spotify indicator.
         * @param {string} extensionPath - The path to the extension's directory.
         */
        _buildUI(extensionPath) {
            logDebug('Building UI');

            // Create the main horizontal box layout for the indicator
            let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
            this.add_child(hbox); // Add the box layout to the PanelMenu.Button

            // Spotify icon - Load the SVG from the icons directory using extensionPath
            this.spotifyIcon = new St.Icon({
                gicon: Gio.icon_new_for_string(`${extensionPath}/icons/spotify.svg`), // Path to the Spotify SVG icon
                icon_size: 16,
                style_class: 'spotify-icon',
            });
            hbox.add_child(this.spotifyIcon);

            // Separator - Adds spacing between UI elements
            hbox.add_child(new St.Label({ text: ' ' }));

            // Artist and Song Title label
            this.trackLabel = new St.Label({
                text: _('No Track Playing'),
                y_expand: true,
                y_align: Clutter.ActorAlign.CENTER,
            });
            hbox.add_child(this.trackLabel);

            // Separator for spacing
            hbox.add_child(new St.Label({ text: ' ' }));

            // Create the control buttons: Previous, Play/Pause, Next
            this.prevButton = new St.Button({
                style_class: 'system-status-icon',
                child: new St.Icon({ icon_name: 'media-skip-backward-symbolic' }),
            });
            this.playPauseButton = new St.Button({
                style_class: 'system-status-icon',
                child: new St.Icon({ icon_name: 'media-playback-start-symbolic' }),
            });
            this.nextButton = new St.Button({
                style_class: 'system-status-icon',
                child: new St.Icon({ icon_name: 'media-skip-forward-symbolic' }),
            });

            hbox.add_child(this.prevButton);
            hbox.add_child(this.playPauseButton);
            hbox.add_child(this.nextButton);

            // Connect the 'clicked' signal of each button to their respective handler functions
            this.prevButton.connect('clicked', () => this._sendMPRISCommand('Previous'));
            this.playPauseButton.connect('clicked', () => this._sendMPRISCommand('PlayPause'));
            this.nextButton.connect('clicked', () => this._sendMPRISCommand('Next'));

            logDebug('UI built');
        }

        /**
         * Monitors Spotify's presence on the D-Bus.
         * Shows or hides the indicator based on whether Spotify is running.
         */
        _monitorSpotifyPresence() {
            logDebug('Starting to monitor Spotify presence');
            this.hide();

            // Watch for the Spotify MPRIS D-Bus name to appear or vanish
            this._spotifyWatcherId = Gio.DBus.session.watch_name(
                SPOTIFY_BUS_NAME,
                Gio.BusNameWatcherFlags.NONE,
                this._onSpotifyAppeared.bind(this),
                this._onSpotifyVanished.bind(this)
            );
        }

        /**
         * Callback function when Spotify appears on the D-Bus.
         * Shows the indicator and subscribes to property changes.
         */
        async _onSpotifyAppeared() {
            logDebug('Spotify appeared on D-Bus');
            this.show();

            // Fetch the initial PlaybackStatus and Metadata from Spotify
            try {
                let playbackStatus = await this._getPlaybackStatus();
                let metadata = await this._getMetadata();
                this._updatePlayPauseIcon(playbackStatus);
                this._updateTrackInfo(metadata);
            } catch (e) {
                logError(e, 'Failed to get initial PlaybackStatus or Metadata');
            }

            // Subscribe to the PropertiesChanged signal to receive real-time updates
            this._signalSubscriptionId = Gio.DBus.session.signal_subscribe(
                SPOTIFY_BUS_NAME,
                PROPERTIES_INTERFACE,
                'PropertiesChanged',
                SPOTIFY_OBJECT_PATH,
                null,
                Gio.DBusSignalFlags.NONE,
                this._onPropertiesChanged.bind(this)
            );
        }

        /**
         * Handler for the PropertiesChanged signal from Spotify.
         * Updates the UI elements based on the changed properties.
         * @param {Gio.DBusConnection} connection - The D-Bus connection.
         * @param {string} sender - The sender's bus name.
         * @param {string} objectPath - The object path of the signal.
         * @param {string} interfaceName - The interface name of the signal.
         * @param {string} signalName - The name of the signal.
         * @param {GLib.Variant} parameters - The parameters of the signal.
         */
        _onPropertiesChanged(connection, sender, objectPath, interfaceName, signalName, parameters) {
            let [iface, changedProps, invalidatedProps] = parameters.deep_unpack();

            // Check if the signal is from the MPRIS Player Interface
            if (iface === MPRIS_PLAYER_INTERFACE) {
                // If PlaybackStatus has changed, update the Play/Pause button icon
                if (changedProps.PlaybackStatus) {
                    let playbackStatus = changedProps.PlaybackStatus.deep_unpack();
                    this._updatePlayPauseIcon(playbackStatus);
                    logDebug(`PlaybackStatus changed to ${playbackStatus}`);
                }

                // If Metadata has changed, update the track information label
                if (changedProps.Metadata) {
                    let metadataVariant = changedProps.Metadata.deep_unpack();

                    // Convert the metadata Variant into a plain JavaScript object
                    let metadata = {};
                    for (let key in metadataVariant) {
                        metadata[key] = metadataVariant[key].deep_unpack();
                    }

                    this._updateTrackInfo(metadata);
                    logDebug('Metadata changed');
                }
            }
        }

        /**
         * Retrieves the current PlaybackStatus from Spotify using D-Bus.
         * @returns {Promise<string>} - A promise that resolves to the playback status.
         */
        async _getPlaybackStatus() {
            return new Promise((resolve, reject) => {
                Gio.DBus.session.call(
                    SPOTIFY_BUS_NAME,
                    SPOTIFY_OBJECT_PATH,
                    PROPERTIES_INTERFACE,
                    'Get',
                    new GLib.Variant('(ss)', [MPRIS_PLAYER_INTERFACE, 'PlaybackStatus']), // Parameters for the method
                    GLib.VariantType.new('(v)'), // Expected return type
                    Gio.DBusCallFlags.NONE,
                    -1,
                    null,
                    (connection, result) => { // Callback after the call is complete
                        try {
                            let response = connection.call_finish(result);
                            let [playbackStatusVariant] = response.deep_unpack();
                            let playbackStatus = playbackStatusVariant.deep_unpack();
                            resolve(playbackStatus);
                        } catch (e) {
                            reject(e);
                        }
                    }
                );
            });
        }

        /**
         * Retrieves the current Metadata from Spotify using D-Bus.
         * @returns {Promise<Object>} - A promise that resolves to the metadata object.
         */
        async _getMetadata() {
            return new Promise((resolve, reject) => {
                Gio.DBus.session.call(
                    SPOTIFY_BUS_NAME,
                    SPOTIFY_OBJECT_PATH,
                    PROPERTIES_INTERFACE,
                    'Get',
                    new GLib.Variant('(ss)', [MPRIS_PLAYER_INTERFACE, 'Metadata']),
                    GLib.VariantType.new('(v)'),
                    Gio.DBusCallFlags.NONE,
                    -1,
                    null,
                    (connection, result) => {
                        try {
                            let response = connection.call_finish(result);
                            let [metadataVariant] = response.deep_unpack();
                            let metadata = metadataVariant.deep_unpack();

                            let metadataUnpacked = {};
                            for (let key in metadata) {
                                metadataUnpacked[key] = metadata[key].deep_unpack();
                            }

                            resolve(metadataUnpacked);
                        } catch (e) {
                            reject(e);
                        }
                    }
                );
            });
        }

        /**
         * Updates the track information label with the current artist and song title.
         * @param {Object} metadata - The metadata object containing track information.
         */
        _updateTrackInfo(metadata) {
            let artistArray = this._recursiveUnpack(metadata['xesam:artist']);
            let title = this._recursiveUnpack(metadata['xesam:title']);

            let artist = _('Unknown Artist');
            if (Array.isArray(artistArray) && artistArray.length > 0) {
                artist = artistArray[0]; // Use the first artist in the array
            }

            if (!title) {
                title = _('Unknown Title');
            }

            this.trackLabel.text = `${artist} - ${title}`;
            logDebug(`Updated track info: ${artist} - ${title}`);
        }

        /**
         * Recursively unpacks a GLib.Variant if necessary.
         * @param {any} variant - The value to unpack.
         * @returns {any} - The unpacked value.
         */
        _recursiveUnpack(variant) {
            if (variant instanceof GLib.Variant) {
                return variant.deep_unpack(); // Unpack the Variant to get the raw value
            } else {
                return variant; // Return the value as-is if it's not a Variant
            }
        }

        /**
         * Updates the Play/Pause button icon based on the current playback status.
         * @param {string} playbackStatus - The current playback status ('Playing' or other).
         */
        _updatePlayPauseIcon(playbackStatus) {
            let iconName = playbackStatus === 'Playing' ? 'media-playback-pause-symbolic' : 'media-playback-start-symbolic';
            this.playPauseButton.child.icon_name = iconName;
            logDebug(`Updated play/pause icon to ${iconName}`);
        }

        /**
         * Sends an MPRIS command (e.g., 'Previous', 'PlayPause', 'Next') to Spotify.
         * @param {string} command - The MPRIS command to send.
         */
        _sendMPRISCommand(command) {
            logDebug(`Sending MPRIS command: ${command}`);
            Gio.DBus.session.call(
                SPOTIFY_BUS_NAME,
                SPOTIFY_OBJECT_PATH,
                MPRIS_PLAYER_INTERFACE,
                command,
                null,
                null,
                Gio.DBusCallFlags.NONE,
                -1,
                null,
                (conn, res) => {
                    try {
                        conn.call_finish(res);
                        logDebug(`MPRIS command '${command}' sent successfully`);
                    } catch (e) {
                        logError(e, `Failed to send MPRIS command: ${command}`);
                    }
                }
            );
        }

        /**
         * Callback function when Spotify vanishes from the D-Bus.
         * Hides the indicator and cleans up signal subscriptions.
         */
        _onSpotifyVanished() {
            logDebug('Spotify vanished from D-Bus');
            this.hide();

            if (this._signalSubscriptionId) {
                Gio.DBus.session.signal_unsubscribe(this._signalSubscriptionId);
                this._signalSubscriptionId = null;
            }
        }

        /**
         * Cleans up resources when the SpotifyIndicator is destroyed.
         */
        destroy() {
            logDebug('Destroying SpotifyIndicator');

            // Unwatch Spotify's D-Bus name if it was being watched
            if (this._spotifyWatcherId) {
                Gio.DBus.session.unwatch_name(this._spotifyWatcherId);
                this._spotifyWatcherId = null;
            }

            // Unsubscribe from the PropertiesChanged signal if subscribed
            if (this._signalSubscriptionId) {
                Gio.DBus.session.signal_unsubscribe(this._signalSubscriptionId);
                this._signalSubscriptionId = null;
            }

            super.destroy();
        }
    }
);

// Initialize the spotifyIndicator variable
let spotifyIndicator = null;

/**
 * SpotifyControlsExtension Class
 * Manages the lifecycle (enable/disable) of the Spotify Controls extension.
 * Extends the base Extension class to utilize its properties and methods.
 */
export default class SpotifyControlsExtension extends Extension {
    /**
     * Constructor for SpotifyControlsExtension.
     * @param {Object} metadata - The metadata object provided by GNOME Shell.
     */
    constructor(metadata) {
        super(metadata); // Pass the metadata to the base class constructor
        logDebug('Initializing SpotifyControlsExtension');
    }

    /**
     * Called when the extension is enabled.
     * Initializes the SpotifyIndicator and adds it to the panel.
     */
    enable() {
        logDebug('Enabling SpotifyControlsExtension');
        this._settings = this.getSettings(); // Access settings via the base class method
        this._settingsChangedId = this._settings.connect('changed::position', this._onSettingsChanged.bind(this));

        this._updateIndicator();
    }

    /**
     * Updates the position of the SpotifyIndicator based on user settings.
     */
    _updateIndicator() {
        if (spotifyIndicator) {
            spotifyIndicator.destroy();
            spotifyIndicator = null;
        }

        // Pass this.path to the SpotifyIndicator
        spotifyIndicator = new SpotifyIndicator(this.path);

        let position = this._settings.get_string('position');

        const validPositions = [
            'far-left',
            'mid-left',
            'rightmost-left',
            'middle-left',
            'center',
            'middle-right',
            'leftmost-right',
            'mid-right',
            'far-right'
        ];

        if (!validPositions.includes(position)) {
            position = 'rightmost-left';
        }

        let boxName;
        let offset = null;

        switch (position) {
            case 'far-left':
                boxName = 'left';
                offset = 0;
                break;
            case 'mid-left':
                boxName = 'left';
                offset = Math.floor(Main.panel._leftBox.get_children().length / 2);
                break;
            case 'rightmost-left':
                boxName = 'left';
                offset = Main.panel._leftBox.get_children().length;
                break;
            case 'middle-left':
                boxName = 'center';
                offset = Math.max(0, Math.floor(Main.panel._centerBox.get_children().length / 2) - 1);
                break;
            case 'center':
                boxName = 'center';
                offset = Math.floor(Main.panel._centerBox.get_children().length / 2);
                break;
            case 'middle-right':
                boxName = 'center';
                offset = Math.floor(Main.panel._centerBox.get_children().length / 2) + 1;
                break;
            case 'leftmost-right':
                boxName = 'right';
                offset = 0;
                break;
            case 'mid-right':
                boxName = 'right';
                offset = Math.floor(Main.panel._rightBox.get_children().length / 2);
                break;
            case 'far-right':
                boxName = 'right';
                offset = Main.panel._rightBox.get_children().length;
                break;
            default:
                boxName = 'right';
                offset = null;
        }

        Main.panel.addToStatusArea('spotify-indicator', spotifyIndicator, offset, boxName);
        logDebug(`Indicator added at position: ${position}, box: ${boxName}, offset: ${offset}`);
    }

    /**
     * Callback function when the 'position' setting changes.
     * Updates the indicator's position accordingly.
     */
    _onSettingsChanged() {
        logDebug('Settings changed: updating indicator position');
        this._updateIndicator();
    }

    /**
     * Called when the extension is disabled.
     * Destroys the SpotifyIndicator and disconnects settings signals.
     */
    disable() {
        logDebug('Disabling SpotifyControlsExtension');
        if (spotifyIndicator) {
            spotifyIndicator.destroy();
            spotifyIndicator = null;
        }

        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }

        this._settings = null;
    }
}
