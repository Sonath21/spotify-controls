/*
 * Spotify Controls Extension
 * Copyright (C) 2024 Athanasios Raptis
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

/**
 * Define the PositionItem GObject class for Indicator Position choices.
 */
const PositionItem = GObject.registerClass(
    {
        GTypeName: 'SpotifyControlsPositionItem',
        Properties: {
            'title': GObject.ParamSpec.string('title', 'Title', 'Title', GObject.ParamFlags.READWRITE, ''),
            'value': GObject.ParamSpec.string('value', 'Value', 'Value', GObject.ParamFlags.READWRITE, ''),
        },
    },
    class PositionItem extends GObject.Object {
        _init(props = {}) {
            super._init(props);
        }
    }
);

/**
 * Define the ControlsPositionItem GObject class for Playback Controls Position choices.
 */
const ControlsPositionItem = GObject.registerClass(
    {
        GTypeName: 'SpotifyControlsControlsPositionItem',
        Properties: {
            'title': GObject.ParamSpec.string('title', 'Title', 'Title', GObject.ParamFlags.READWRITE, ''),
            'value': GObject.ParamSpec.string('value', 'Value', 'Value', GObject.ParamFlags.READWRITE, ''),
        },
    },
    class ControlsPositionItem extends GObject.Object {
        _init(props = {}) {
            super._init(props);
        }
    }
);

/**
 * SpotifyControlsPrefs class handles the preferences window for the extension.
 */
export default class SpotifyControlsPrefs extends ExtensionPreferences {
    /**
     * Fills the preferences window with necessary widgets and settings.
     * @param {Gtk.Window} window - The preferences window.
     */
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        // Set window properties
        window.set_default_size(600, 400);
        window.set_title(_('Spotify Controls Preferences'));

        // Create the main preferences page
        const page = new Adw.PreferencesPage();

        /**
         * GENERAL SETTINGS GROUP
         */
        const generalGroup = new Adw.PreferencesGroup({
            title: _('General Settings'),
        });

        /**
         * INDICATOR POSITION SECTION
         */
        const positions = [
            new PositionItem({ title: _('Far Left'),         value: 'far-left' }),
            new PositionItem({ title: _('Mid Left'),         value: 'mid-left' }),
            new PositionItem({ title: _('Rightmost Left'),   value: 'rightmost-left' }),
            new PositionItem({ title: _('Middle Left'),      value: 'middle-left' }),
            new PositionItem({ title: _('Center'),           value: 'center' }),
            new PositionItem({ title: _('Middle Right'),     value: 'middle-right' }),
            new PositionItem({ title: _('Leftmost Right'),   value: 'leftmost-right' }),
            new PositionItem({ title: _('Mid Right'),        value: 'mid-right' }),
            new PositionItem({ title: _('Far Right'),        value: 'far-right' }),
        ];

        const positionStore = new Gio.ListStore({ item_type: PositionItem });
        positions.forEach(pos => positionStore.append(pos));

        const positionComboRow = new Adw.ComboRow({
            title: _('Indicator Position'),
            subtitle: _('Select the position of the Spotify controls in the top bar'),
            model: positionStore,
            expression: Gtk.PropertyExpression.new(PositionItem, null, 'title'),
        });

        const currentPositionValue = settings.get_string('position');
        const currentIndex = positions.findIndex(pos => pos.value === currentPositionValue);
        positionComboRow.set_selected(currentIndex >= 0 ? currentIndex : 0);

        positionComboRow.connect('notify::selected', (row) => {
            const selectedIndex = row.get_selected();
            const selectedItem = positionStore.get_item(selectedIndex);
            if (selectedItem) {
                settings.set_string('position', selectedItem.value);
            }
        });

        generalGroup.add(positionComboRow);

        /**
         * PLAYBACK CONTROLS POSITION SECTION
         */
        const controlsPositions = [
            new ControlsPositionItem({ title: _('Left'),  value: 'left'  }),
            new ControlsPositionItem({ title: _('Right'), value: 'right' }),
        ];

        const controlsPositionStore = new Gio.ListStore({ item_type: ControlsPositionItem });
        controlsPositions.forEach(pos => controlsPositionStore.append(pos));

        const controlsPositionComboRow = new Adw.ComboRow({
            title: _('Playback Controls Position'),
            subtitle: _('Select whether the playback controls should appear on the left or right'),
            model: controlsPositionStore,
            expression: Gtk.PropertyExpression.new(ControlsPositionItem, null, 'title'),
        });

        const currentControlsPositionValue = settings.get_string('controls-position');
        const controlsSelectedIndex = controlsPositions.findIndex(pos => pos.value === currentControlsPositionValue);
        controlsPositionComboRow.set_selected(controlsSelectedIndex >= 0 ? controlsSelectedIndex : 1);

        controlsPositionComboRow.connect('notify::selected', (row) => {
            const selectedIndex = row.get_selected();
            const selectedItem = controlsPositionStore.get_item(selectedIndex);
            if (selectedItem) {
                settings.set_string('controls-position', selectedItem.value);
            }
        });

        generalGroup.add(controlsPositionComboRow);

        /**
         * ENABLE VOLUME CONTROL TOGGLE
         */
        const enableVolumeControlSwitch = new Adw.SwitchRow({
            title: _('Enable Volume Control'),
            subtitle: _('Toggle the volume control feature using the scroll wheel over the song title'),
            activatable: true,
            active: settings.get_boolean('enable-volume-control'),
        });

        settings.bind(
            'enable-volume-control',
            enableVolumeControlSwitch,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        generalGroup.add(enableVolumeControlSwitch);

        /**
         * ENABLE MIDDLE CLICK TOGGLE
         */
        const enableMiddleClickSwitch = new Adw.SwitchRow({
            title: _('Enable Middle Click Play/Pause'),
            subtitle: _('Allows toggling the current track with a middle-click on the extension.'),
            activatable: true,
            active: settings.get_boolean('enable-middle-click'),
        });

        settings.bind(
            'enable-middle-click',
            enableMiddleClickSwitch,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        generalGroup.add(enableMiddleClickSwitch);

        /**
         * MINIMIZE ON SECOND CLICK TOGGLE
         */
        const minimizeOnSecondClickSwitch = new Adw.SwitchRow({
            title: _('Minimize on Second Click'),
            subtitle: _('If true, clicking the extension again minimizes Spotify if it is already in the foreground.'),
            activatable: true,
            active: settings.get_boolean('minimize-on-second-click'),
        });

        // Bind to the new key
        settings.bind(
            'minimize-on-second-click',
            minimizeOnSecondClickSwitch,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        generalGroup.add(minimizeOnSecondClickSwitch);

        // Add the general group to the main page
        page.add(generalGroup);

        /**
         * DISPLAY OPTIONS GROUP
         */
        const displayGroup = new Adw.PreferencesGroup({
            title: _('Display Options'),
        });

        /**
         * SHOW PLAYBACK CONTROLS TOGGLE
         */
        const showControlsSwitch = new Adw.SwitchRow({
            title: _('Show Playback Controls'),
            subtitle: _('Toggle the visibility of the playback controls (Previous, Play/Pause, Next)'),
            activatable: true,
            active: settings.get_boolean('show-playback-controls'),
        });

        settings.bind(
            'show-playback-controls',
            showControlsSwitch,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        displayGroup.add(showControlsSwitch);

        /**
         * SHOW SPOTIFY ICON TOGGLE
         */
        const showSpotifyIconSwitch = new Adw.SwitchRow({
            title: _('Show Spotify Icon'),
            subtitle: _('Toggle the visibility of the Spotify logo in the top bar'),
            activatable: true,
            active: settings.get_boolean('show-spotify-icon'),
        });

        settings.bind(
            'show-spotify-icon',
            showSpotifyIconSwitch,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        displayGroup.add(showSpotifyIconSwitch);

        /**
         * SHOW ARTIST/TRACK INFO TOGGLE
         */
        const showTrackInfoSwitch = new Adw.SwitchRow({
            title: _('Show Artist/Track Info'),
            subtitle: _('Toggle the visibility of the Artist and Track information in the top bar'),
            activatable: true,
            active: settings.get_boolean('show-track-info'),
        });

        settings.bind(
            'show-track-info',
            showTrackInfoSwitch,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        displayGroup.add(showTrackInfoSwitch);

        // Add the display group to the page
        page.add(displayGroup);

        // Finally, add the page to the window and show
        window.add(page);
        window.show();
    }
}
