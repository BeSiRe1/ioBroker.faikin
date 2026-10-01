# Changelog

## 0.1.3 (2026-10-01)

- Show device reachability in the object tree using the built-in status indicator.
- Separate writable controls and one-time commands into `Control` and `Commands` object folders.
- Store MQTT topics without a device hostname in a fixed `General` folder instead of creating a pseudo-device.
- Group Faikin `info/<hostname>/...` data in a separate `Info` channel and give known fields descriptive names.
- Place the reported humidity, power, and heating activity values in the device's `Status` channel.
- Move protocol and device timestamp to `Info`; show module reachability and air-conditioner response separately in `Status`.
- Distinguish Faikin module reachability from the air conditioner response state; collect undocumented raw values under `Info.Unverified`, keep the energy counters in `Status`, and clarify datapoint labels.

## 0.1.2 (2026-10-01)

- Subscribe to writable control states so commands are processed.
- Map incoming online status to the dedicated device online state.

## 0.1.1 (2026-09-30)

- Use a generic default hostname (`Faikin`) for general MQTT topics.

## 0.1.0 (2026-09-30)

- Initial development version with an embedded MQTT broker, automatic multi-device discovery, dynamic status datapoints, controls, and general Faikin MQTT access.
