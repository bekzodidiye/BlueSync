# BlueSync Audio Manager

Professional Linux Bluetooth audio management dashboard.

## System Integration Strategy

This application interfaces with the following Linux subsystems:

1.  **BlueZ**: Backend uses `bluetoothctl` to monitor device connection events.
2.  **PipeWire / PulseAudio**:
    *   `pactl list sinks`: To identify available audio outputs.
    *   `pactl load-module module-combine-sink`: To create virtual outputs for multi-device sync.
    *   `wpctl status`: To identify current active routes and node IDs.

## Production Deployment Recommendations

1.  **Systemd Service**:
    Run this application as a user-level systemd service to ensure it starts with the session.
    ```ini
    [Unit]
    Description=BlueSync Audio Manager
    After=pipewire.service bluetooth.service

    [Service]
    ExecStart=/usr/bin/npm start
    WorkingDirectory=/opt/bluesync
    Restart=always

    [Install]
    WantedBy=default.target
    ```

2.  **Stability Best Practices**:
    *   **Latency Tuning**: Adjust `latency_offset` on the combined sink if you notice echo between devices.
    *   **Auto-reconnect**: The backend monitors BlueZ DBus signals to automatically restore routing when a known device reconnects.
    *   **Buffer Sizes**: Ensure PipeWire quantum size is sufficient to handle multiple high-bitrate LDAC/AptX streams.

## Security Rules (Mocked for Preview)

In a real production environment, ensure the user running this app is in the `audio` and `bluetooth` groups.
