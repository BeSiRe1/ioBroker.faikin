# Faikin for ioBroker

This adapter connects Faikin/Faikout modules to ioBroker and includes its own MQTT broker. One adapter instance can manage multiple Faikin/Faikout modules. Each module needs a unique hostname configured under **WiFi settings** in the Faikin interface.

See the [official Faikin documentation](https://www.faikin.au/pages/instructions) for module setup and firmware information.

## Features

- Built-in MQTT broker with configurable port and bind address, plus optional username and password.
- Multiple Faikin modules per adapter instance, each with its own device folder.
- Automatic datapoints for reported status values and MQTT messages.
- Writable controls are created only for functions reported by each module.
- Separate indicators for Faikin module reachability and air-conditioner reachability.
- Energy counters and consumption history in kWh.
- The ioBroker MQTT adapter is not required for Faikin modules to connect.

## Object structure

Each module has its own folder named after its hostname:

```text
<hostname>
├─ Status       climate values and operating state
├─ Info         Faikin module information
├─ Energy       energy counters and consumption history
├─ Control      supported controls
├─ Commands     one-time actions
└─ MQTT         received MQTT messages
```

MQTT topics without a device hostname are stored in the adapter-level `General.MQTT` folder. The adapter-level `info.connection` state lists connected MQTT client hostnames.

## Energy consumption

Under `<hostname>.Energy`:

- `Total`: cumulative total, heating, and cooling counters reported by Faikin, in kWh.
- `Current.Day`, `Current.Month`, and `Current.Year`: calculated consumption for the current day, month, and year, each split into total, heating, and cooling.
- `History.day`, `History.month`, and `History.year`: JSON lists of completed daily, monthly, and yearly values. Each entry contains its period and total, heating, and cooling consumption in kWh.

Consumption is calculated from changes in the energy counters reported by Faikin. Recording begins when the adapter receives the counters. Past periods cannot be reconstructed, so the first period in progress is incomplete.

## Setup

1. In ioBroker Admin, open **Adapters → Custom Install → Any URL** and enter `https://github.com/BeSiRe1/ioBroker.faikin`.
2. Choose an unused MQTT port. The default is `1884`.
3. If needed, set an MQTT username and password in the adapter settings.
4. In each Faikin module's MQTT settings, enter the ioBroker server's LAN address, the adapter port, and the same credentials.
5. Assign each module a unique hostname under **WiFi settings** in the Faikin interface.
6. Enable **Live status** (`livestatus`) in the Faikin interface so the adapter receives status changes promptly.

The broker uses unencrypted MQTT. Keep it on a trusted local network and do not expose its port to the internet. Available values depend on the air-conditioner model and firmware.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for changes by version.

## Development

Requirement: Node.js 22.19 or newer.

```sh
npm install
npm test
```

## License

MIT. See [LICENSE](LICENSE).

---

# Faikin für ioBroker

Der Adapter verbindet Faikin-/Faikout-Module mit ioBroker und stellt einen eigenen MQTT-Broker bereit. Eine Adapterinstanz kann mehrere Faikin-/Faikout-Module verwalten. Jedes Modul benötigt einen eigenen Hostnamen, den du in der Faikin-Oberfläche unter **WiFi settings** einstellst.

Informationen zur Einrichtung des Moduls findest du in der [offiziellen Faikin-Dokumentation](https://www.faikin.au/pages/instructions).

## Funktionen

- Integrierter MQTT-Broker mit einstellbarem Port und Bind-Adresse sowie optionalem Benutzernamen und Passwort.
- Mehrere Faikin-Module pro Adapterinstanz, jeweils mit eigenem Geräteordner.
- Automatisch angelegte Datenpunkte für gemeldete Statuswerte und MQTT-Nachrichten.
- Steuerdatenpunkte nur für Funktionen, die das jeweilige Modul meldet.
- Getrennte Anzeigen für die Erreichbarkeit des Faikin-Moduls und der Klimaanlage.
- Energiezähler und Verbrauchsverläufe in kWh.
- Der ioBroker-MQTT-Adapter wird für die Verbindung der Faikin-Module nicht benötigt.

## Objektstruktur

Jedes Modul erhält einen eigenen Ordner unter seinem Hostnamen:

```text
<hostname>
├─ Status       Klimawerte und Betriebszustand
├─ Info         Informationen zum Faikin-Modul
├─ Energy       Energiezähler und Verbrauchsverläufe
├─ Control      unterstützte Steuerungen
├─ Commands     einmalige Aktionen
└─ MQTT         empfangene MQTT-Nachrichten
```

MQTT-Themen ohne Geräte-Hostname stehen im adapterweiten Ordner `General.MQTT`. Der adapterweite Datenpunkt `info.connection` enthält die Hostnamen der verbundenen MQTT-Clients.

## Energieverbrauch

Unter `<hostname>.Energy` findest du:

- `Total`: die von Faikin gemeldeten Gesamt-, Heiz- und Kühlenergiezähler in kWh.
- `Current.Day`, `Current.Month` und `Current.Year`: den berechneten Verbrauch für den aktuellen Tag, Monat und das aktuelle Jahr, jeweils gesamt sowie für Heizen und Kühlen.
- `History.day`, `History.month` und `History.year`: JSON-Listen mit abgeschlossenen Tages-, Monats- und Jahreswerten. Jeder Eintrag enthält den Zeitraum sowie Gesamt-, Heiz- und Kühlverbrauch in kWh.

Die Verbräuche werden aus den Änderungen der von Faikin gemeldeten Energiezähler berechnet. Die Aufzeichnung beginnt, sobald der Adapter die Zählerstände empfängt. Bereits vergangene Zeiträume können nicht nachträglich rekonstruiert werden; der erste noch laufende Zeitraum ist daher unvollständig.

## Einrichtung

1. Installiere den Adapter über **Adapter → Benutzerdefinierte Installation → Beliebige URL** und gib `https://github.com/BeSiRe1/ioBroker.faikin` ein.
2. Wähle einen freien MQTT-Port. Standardmäßig ist Port `1884` eingestellt.
3. Lege bei Bedarf MQTT-Benutzername und Passwort in den Adaptereinstellungen fest.
4. Trage in jedem Faikin-Modul unter den MQTT-Einstellungen die LAN-Adresse des ioBroker-Servers, den Adapter-Port und dieselben Zugangsdaten ein.
5. Vergib in der Faikin-Oberfläche unter **WiFi settings** für jedes Modul einen eigenen Hostnamen.
6. Aktiviere **Live status** (`livestatus`) in der Faikin-Oberfläche, damit der Adapter Statusänderungen zeitnah empfängt.

Der Broker verwendet unverschlüsseltes MQTT. Betreibe ihn nur in einem vertrauenswürdigen lokalen Netzwerk und gib seinen Port nicht für Zugriffe aus dem Internet frei. Welche Werte verfügbar sind, hängt vom Klimaanlagenmodell und der Firmware ab.

## Versionsverlauf

Die Änderungen pro Version stehen in der [CHANGELOG.md](CHANGELOG.md).

## Entwicklung

Voraussetzung: Node.js 22.19 oder neuer.

```sh
npm install
npm test
```

## Lizenz

MIT. Siehe [LICENSE](LICENSE).
