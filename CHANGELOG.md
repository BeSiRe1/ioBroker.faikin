# Changelog

## 0.1.3 (2026-10-01)

- Distinguish Faikin module reachability from air-conditioner reachability.
- Separate controls from one-time commands and collect MQTT topics without a device hostname under `General`.

## 0.1.2 (2026-10-01)

- Subscribe to writable control states and send their changes through MQTT.
- Process the air-conditioner status reported by Faikin.

## 0.1.1 (2026-09-30)

- Add a configurable MQTT bind address and port, with optional authentication.

## 0.1.0 (2026-09-30)

- Initial development version with an embedded MQTT broker, automatic multi-device discovery, dynamic status datapoints, controls, and general Faikin MQTT access.
