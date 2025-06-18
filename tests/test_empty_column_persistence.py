def test_empty_column_position():
    # Arrange
    settings_manager = SettingsManager()
    initial_settings = [
        {"name": "column-1", "position": 1},
        {"name": "empty-test", "position": 2},
        {"name": "column-3", "position": 3},
    ]
    
    # Act
    settings_manager.save_settings(initial_settings)
    retrieved_settings = settings_manager.load_settings()
    
    # Assert
    assert retrieved_settings[1]["name"] == "empty-test", "The 'empty-test' column is not at position 2"
    assert retrieved_settings[0]["name"] == "column-1", "The 'column-1' is not at position 1"
    assert retrieved_settings[2]["name"] == "column-3", "The 'column-3' is not at position 3"