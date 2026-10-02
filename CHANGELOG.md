# Changelog

## 0.1.2 (2026-10-02)

- Group Faikin energy counters, current day/month/year consumption, and retained daily/monthly/yearly JSON histories under `Energy`; display all energy values in kWh.
- Create writable controls only when a Faikin module reports the corresponding capability.
- Use temperature limits and step size reported by the module through MQTT discovery when available.
- Add the additional reported controls for presets, demand, sensor, display LED, and humidification.
- Derive module reachability from `up`, air-conditioner reachability from `online`, and clear both when the module disconnects.
- Give the known information fields (`flash`, `id`, `mem`, `mqtt-up`, `rst`, and `spi`) descriptive names; set memory-size units to bytes and MQTT runtime to seconds.
- Place climate status values under `Status` and device/module information under `Info`, including known information fields delivered in a state payload; put module reachability in `Info` and air-conditioner reachability in `Status`.

## 0.1.1 (2026-10-01)

- List connected Faikin hostnames in the adapter-level connection state.
- Discover multiple Faikin modules, separate their objects, and distinguish module reachability from air-conditioner reachability.
- Separate controls from one-time commands and collect MQTT topics without a device hostname under `General`.

## 0.1.0 (2026-09-30)

- Add a configurable MQTT broker with bind address, port, and optional authentication.
- Initial development version with an embedded MQTT broker, status datapoints, controls, and general Faikin MQTT access.
