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

        // Create a preferences group for general settings
        const group = new Adw.PreferencesGroup({
            title: _('General Settings'),
        });

        /**
         * Indicator Position Section
         */

        // Define the choices for the indicator position using PositionItem instances
        const positions = [
            new PositionItem({ title: _('Far Left'), value: 'far-left' }),
            new PositionItem({ title: _('Mid Left'), value: 'mid-left' }),
            new PositionItem({ title: _('Rightmost Left'), value: 'rightmost-left' }),
            new PositionItem({ title: _('Middle Left'), value: 'middle-left' }),
            new PositionItem({ title: _('Center'), value: 'center' }),
            new PositionItem({ title: _('Middle Right'), value: 'middle-right' }),
            new PositionItem({ title: _('Leftmost Right'), value: 'leftmost-right' }),
            new PositionItem({ title: _('Mid Right'), value: 'mid-right' }),
            new PositionItem({ title: _('Far Right'), value: 'far-right' }),
        ];

        // Create a ListStore to hold the indicator positions
        const positionStore = new Gio.ListStore({ item_type: PositionItem });

        // Append PositionItem instances to the ListStore
        positions.forEach(pos => positionStore.append(pos));

        // Create the ComboRow for selecting the indicator position
        const positionComboRow = new Adw.ComboRow({
            title: _('Indicator Position'),
            subtitle: _('Select the position of the Spotify controls in the top bar'),
            model: positionStore,
            expression: Gtk.PropertyExpression.new(PositionItem, null, 'title'),
        });

        // Retrieve the current position setting
        const currentPositionValue = settings.get_string('position');
        const currentIndex = positions.findIndex(pos => pos.value === currentPositionValue);
        positionComboRow.set_selected(currentIndex >= 0 ? currentIndex : 0); // Default to first option if not found

        // Connect the 'notify::selected' signal to update the settings when selection changes
        positionComboRow.connect('notify::selected', (row) => {
            const selectedIndex = row.get_selected();
            const selectedItem = positionStore.get_item(selectedIndex);
            if (selectedItem) {
                const selectedPosition = selectedItem.value;
                settings.set_string('position', selectedPosition);
            }
        });

        // Add the Indicator Position ComboRow to the group
        group.add(positionComboRow);

        /**
         * Playback Controls Position Section
         */

        // Define the choices for playback controls position using ControlsPositionItem instances
        const controlsPositions = [
            new ControlsPositionItem({ title: _('Left'), value: 'left' }),
            new ControlsPositionItem({ title: _('Right'), value: 'right' }),
        ];

        // Create a ListStore to hold the playback controls positions
        const controlsPositionStore = new Gio.ListStore({ item_type: ControlsPositionItem });

        // Append ControlsPositionItem instances to the ListStore
        controlsPositions.forEach(pos => controlsPositionStore.append(pos));

        // Create the ComboRow for selecting playback controls position
        const controlsPositionComboRow = new Adw.ComboRow({
            title: _('Playback Controls Position'),
            subtitle: _('Select whether the playback controls should appear on the left or right'),
            model: controlsPositionStore,
            expression: Gtk.PropertyExpression.new(ControlsPositionItem, null, 'title'),
        });

        // Retrieve the current playback controls position setting
        const currentControlsPositionValue = settings.get_string('controls-position');
        const controlsSelectedIndex = controlsPositions.findIndex(pos => pos.value === currentControlsPositionValue);
        controlsPositionComboRow.set_selected(controlsSelectedIndex >= 0 ? controlsSelectedIndex : 1); // Default to 'Right' if not found

        // Connect the 'notify::selected' signal to update the settings when selection changes
        controlsPositionComboRow.connect('notify::selected', (row) => {
            const selectedIndex = row.get_selected();
            const selectedItem = controlsPositionStore.get_item(selectedIndex);
            if (selectedItem) {
                const selectedPosition = selectedItem.value;
                settings.set_string('controls-position', selectedPosition);
            }
        });

        // Add the Playback Controls Position ComboRow to the group
        group.add(controlsPositionComboRow);

        /**
         * Show Playback Controls Toggle
         */

        // Create a switch row for showing/hiding playback controls
        const showControlsSwitch = new Adw.SwitchRow({
            title: _('Show Playback Controls'),
            subtitle: _('Toggle the visibility of the playback controls (Previous, Play/Pause, Next)'),
            activatable: true,
            active: settings.get_boolean('show-playback-controls'), 
        });

        // Bind the switch to the settings key for automatic synchronization
        settings.bind(
            'show-playback-controls',
            showControlsSwitch,
            'active', 
            Gio.SettingsBindFlags.DEFAULT
        );

        // Add the switch row to the group
        group.add(showControlsSwitch);

        /**
         * Enable Volume Control Toggle
         */

        // Create a switch row for enabling/disabling volume control
        const enableVolumeControlSwitch = new Adw.SwitchRow({
            title: _('Enable Volume Control'),
            subtitle: _('Toggle the volume control feature using the scroll wheel over the song title'),
            activatable: true,
            active: settings.get_boolean('enable-volume-control'), 
        });

        // Bind the switch to the settings key for automatic synchronization
        settings.bind(
            'enable-volume-control',
            enableVolumeControlSwitch,
            'active', 
            Gio.SettingsBindFlags.DEFAULT
        );

        // Add the switch row to the group
        group.add(enableVolumeControlSwitch);

        // Add the group to the preferences page
        page.add(group);

        // Add the page to the window
        window.add(page);
        window.show();
    }
}
