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

import Gtk from "gi://Gtk";
import Gio from "gi://Gio";
import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

const SCHEMA_ID = 'org.gnome.shell.extensions.spotify-controls';

export default class SpotifyControlsPrefs extends ExtensionPreferences {
    getSettings() {
        const extensionDir = Gio.File.new_for_uri(import.meta.url).get_parent();
        const schemasDir = extensionDir.get_child('schemas').get_path();

        const schemaSource = Gio.SettingsSchemaSource.new_from_directory(
            schemasDir,
            Gio.SettingsSchemaSource.get_default(),
            false
        );

        const schemaObj = schemaSource.lookup(SCHEMA_ID, false);

        if (!schemaObj) {
            throw new Error(`Schema ${SCHEMA_ID} could not be found for extension. Please check your installation.`);
        }

        return new Gio.Settings({ settings_schema: schemaObj });
    }

    getPreferencesWidget() {
        const settings = this.getSettings();

        const extensionDir = Gio.File.new_for_uri(import.meta.url).get_parent();
        const prefsXmlPath = extensionDir.get_child('prefs.xml').get_path();

        const builder = new Gtk.Builder();
        builder.add_from_file(prefsXmlPath);

        const prefsWidget = builder.get_object("prefs_widget");
        const positionComboBox = builder.get_object("position_combobox");

        const currentPosition = settings.get_string("position");
        positionComboBox.set_active_id(currentPosition);

        positionComboBox.connect("changed", (widget) => {
            const newValue = widget.get_active_id();
            settings.set_string("position", newValue);
        });

        return prefsWidget;
    }
}

