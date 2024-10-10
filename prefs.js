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

// Define the PositionItem GObject class
const PositionItem = GObject.registerClass(
    {
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

export default class SpotifyControlsPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        window.set_default_size(600, 400);
        window.set_title(_('Spotify Controls Preferences'));

        const page = new Adw.PreferencesPage();

        const group = new Adw.PreferencesGroup({
            title: _('General Settings'),
        });

        // Define the choices for the position setting using PositionItem instances
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

        // Create a ListStore to hold the positions
        const positionStore = new Gio.ListStore({ item_type: PositionItem });

        // Append PositionItem instances to the ListStore
        positions.forEach(pos => positionStore.append(pos));

        // Create the ComboRow for selecting the position
        const positionComboRow = new Adw.ComboRow({
            title: _('Indicator Position'),
            subtitle: _('Select the position of the Spotify controls in the top bar'),
            model: positionStore,
            expression: Gtk.PropertyExpression.new(PositionItem, null, 'title'),
        });

        // Set the selected item based on the current setting
        const currentPositionValue = settings.get_string('position');
        const currentIndex = positions.findIndex(pos => pos.value === currentPositionValue);
        positionComboRow.set_selected(currentIndex >= 0 ? currentIndex : 0);

        // Connect the 'notify::selected' signal to update the settings
        positionComboRow.connect('notify::selected', (row) => {
            const selectedIndex = row.get_selected();
            const selectedItem = positionStore.get_item(selectedIndex);
            const selectedPosition = selectedItem.value;
            settings.set_string('position', selectedPosition);
        });

        group.add(positionComboRow);
        page.add(group);
        window.add(page);
        window.show();
    }
}
