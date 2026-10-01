# Changelog

## 0.1.3 (2026-10-01)

- Show device reachability in the object tree using the built-in status indicator.
- Separate writable controls and one-time commands into `Control` and `Commands` object folders.
- Store MQTT topics without a device hostname in a fixed `General` folder instead of creating a pseudo-device.

## 0.1.2 (2026-10-01)

- Subscribe to writable control states so commands are processed.
- Map incoming online status to the dedicated device online state.

## 0.1.1 (2026-09-30)

- Use a generic default hostname (`Faikin`) for general MQTT topics.

## 0.1.0 (2026-09-30)

- Initial development version with an embedded MQTT broker, automatic multi-device discovery, dynamic status datapoints, controls, and general Faikin MQTT access.
