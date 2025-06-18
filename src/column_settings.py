class ColumnSettingsManager:
    def save_settings(self, settings):
        # Ensure columns are saved in the correct order
        settings.sort(key=lambda col: col.get('position', float('inf')))
        # ...existing code for saving settings...

    def load_settings(self):
        # Ensure columns are loaded in the correct order
        settings = self._retrieve_settings_from_storage()
        settings.sort(key=lambda col: col.get('position', float('inf')))
        return settings