# Changelog

## 0.1.1 (2026-10-01)

- List connected Faikin hostnames in the adapter-level connection state.
- Discover multiple Faikin modules, separate their objects, and distinguish module reachability from air-conditioner reachability.
- Separate controls from one-time commands and collect MQTT topics without a device hostname under `General`.

## 0.1.0 (2026-09-30)

- Add a configurable MQTT broker with bind address, port, and optional authentication.
- Initial development version with an embedded MQTT broker, status datapoints, controls, and general Faikin MQTT access.
