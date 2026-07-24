UPDATE event_settings
SET timezone = 'Asia/Kolkata',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 1;
