# Faikin

An ioBroker adapter for Daikin air conditioners using Faikin/Faikout firmware. It contains its own MQTT broker, so Faikin modules can connect directly to this adapter. One adapter instance can accept several modules. Each Faikin module needs a unique hostname, set under **WiFi settings** in the Faikin interface. Faikin uses this hostname for both DHCP and MQTT.

For device setup and firmware documentation, see the [official Faikin documentation](https://www.faikin.au/pages/instructions).

## Features

- Embedded MQTT broker with an editable port, bind address, and optional credentials.
- Automatic discovery of Faikin/Faikout hostnames and separate device folders.
- General MQTT topics without a device hostname go into a fixed `General` folder, not a device with an online indicator.
- The adapter-level `info.connection` state lists connected Faikin hostnames. Each device's module reachability and the air conditioner's response are shown separately.
- Dynamic datapoints for every status field and MQTT topic received from a device.
- Writable controls are created only for fields the module reports as supported, including power, target temperature, mode, fan, louvre swing, auto mode, schedules, and any reported extra functions. Target temperature limits and step size are read from Faikin's Home Assistant MQTT discovery message when available.
- Clear object folders per device: `Status` for reported values, `Control` for writable settings, `Commands` for one-time actions, and `MQTT` for received messages.
- Climate status values go under `Status`; device and module information goes under `Info`, including known information fields delivered in a state payload. IDs, names, and units remain unchanged. Memory sizes are shown in bytes. The raw `up` value is recorded under `Info` and updates the module reachability indicator under `Status`; `online` updates the air-conditioner reachability indicator there. If the module disconnects, both indicators become false until fresh status reports arrive.
- Generic JSON control, arbitrary commands, and single or bulk settings.
- No dependency on the ioBroker MQTT adapter for Faikin connections.

## Installation from GitHub

Once this repository is public, install it in ioBroker Admin using **Adapters → Custom Install → Any URL** and enter:

`https://github.com/BeSiRe1/ioBroker.faikin`

The command line alternative is `iob url https://github.com/BeSiRe1/ioBroker.faikin`.

## Configuration

1. Choose a free MQTT port. The default is `1884`, which can coexist with a broker already using `1883`.
2. Set a username and password; use the same credentials on every Faikin module.
3. In each module's MQTT settings, enter the ioBroker server's LAN address, the configured port, and the credentials.
4. Set a unique hostname for each module under **WiFi settings** in its Faikin interface. The adapter discovers each module by its MQTT hostname and creates separate objects under `<hostname>.Status`, `<hostname>.Info`, `<hostname>.Control`, `<hostname>.Commands`, and `<hostname>.MQTT`. General MQTT topics without a device hostname are stored in `General.MQTT`.
5. Enable **Live status** (`livestatus`) in the Faikin web interface so status changes are reported promptly.

The broker uses unencrypted MQTT and should only be reachable on a trusted local network. Do not forward its port from the internet. The fields each air conditioner reports depend on its model and firmware; newly received fields and topics are added automatically.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the version history.

## Development

Requirements: Node.js 22.19 or newer.

```sh
npm install
npm test
```

The tests validate the adapter package and start it against an ioBroker controller test environment. GitHub Actions runs them on Node.js 22 and 24.

## License

MIT. See [LICENSE](LICENSE).

---

# Faikin (Deutsch)

Ein ioBroker-Adapter für Daikin-Klimaanlagen mit Faikin-/Faikout-Firmware. Der Adapter enthält einen eigenen MQTT-Broker, mit dem sich die Module direkt verbinden. Eine Adapterinstanz kann mehrere Module aufnehmen. Jedes Faikin-Modul benötigt einen eigenen Hostnamen. Dieser wird in der Faikin-Oberfläche unter **WiFi settings** festgelegt und von Faikin sowohl für DHCP als auch für MQTT verwendet.

Informationen zur Einrichtung und Firmware stehen in der [offiziellen Faikin-Dokumentation](https://www.faikin.au/pages/instructions).

## Funktionen

- Integrierter MQTT-Broker mit änderbarem Port, Bind-Adresse und optionalen Zugangsdaten.
- Automatische Erkennung von Faikin-/Faikout-Hostnamen mit getrennten Geräteordnern.
- Allgemeine MQTT-Themen ohne Geräte-Hostname landen im festen Ordner `General`, der nicht als Gerät mit Online-Anzeige angelegt wird.
- Der adapterweite Datenpunkt `info.connection` listet die verbundenen Faikin-Hostnamen auf. Die Erreichbarkeit jedes Moduls und die Antwort der Klimaanlage werden separat angezeigt.
- Dynamische Datenpunkte für alle vom Gerät empfangenen Statusfelder und MQTT-Themen.
- Steuerpunkte werden nur für Funktionen angelegt, die das Modul in seinen Statusdaten meldet: Ein/Aus, Solltemperatur, Modus, Lüfter, Lamellen, Auto-Modus, Zeitpläne und unterstützte Zusatzfunktionen. Temperaturgrenzen und Schrittweite der Solltemperatur werden – sofern verfügbar – aus Faikins Home-Assistant-MQTT-Erkennung übernommen.
- Eindeutige Objektordner pro Gerät: `Status` für gemeldete Werte, `Control` für einstellbare Werte, `Commands` für einmalige Aktionen und `MQTT` für empfangene Nachrichten.
- Klimastatuswerte liegen unter `Status`; Geräte- und Modulinformationen unter `Info`, auch wenn bekannte Informationsfelder im Status-Payload eintreffen. IDs, Namen und Einheiten bleiben unverändert. Speichergrößen werden in Byte angezeigt. Der Rohwert `up` wird unter `Info` gespeichert und aktualisiert die Erreichbarkeitsanzeige des Moduls unter `Status`; `online` aktualisiert dort die Erreichbarkeit der Klimaanlage. Bei einer Modultrennung werden beide Anzeigen auf „false“ gesetzt, bis neue Statusmeldungen eintreffen.
- Allgemeine JSON-Steuerung, freie Befehle und einzelne oder gebündelte Einstellungen.
- Der MQTT-Adapter ist für die Faikin-Verbindung nicht erforderlich.

## Installation von GitHub

Sobald dieses Repository öffentlich ist, lässt es sich im ioBroker Admin unter **Adapter → Benutzerdefinierte Installation → Beliebige URL** installieren. Dort die GitHub-Adresse von `ioBroker.faikin` eintragen.

## Einrichtung

1. Einen freien MQTT-Port festlegen. Standard ist `1884`, damit ein bereits auf Port `1883` laufender Broker daneben laufen kann.
2. Benutzername und Passwort setzen und dieselben Zugangsdaten in allen Faikin-Modulen eintragen.
3. In jedem Faikin-MQTT-Menü die LAN-Adresse des ioBroker-Servers, den Port und die Zugangsdaten eintragen.
4. Weise jedem Modul in der Faikin-Oberfläche unter **WiFi settings** einen eindeutigen Hostnamen zu. Der Adapter erkennt jedes Modul anhand dieses MQTT-Hostnamens und legt dafür getrennte Objekte unter `<hostname>.Status`, `<hostname>.Info`, `<hostname>.Control`, `<hostname>.Commands` und `<hostname>.MQTT` an. Allgemeine MQTT-Themen ohne Geräte-Hostname erscheinen unter `General.MQTT`.
5. Aktiviere **Live status** (`livestatus`) in der Faikin-Weboberfläche, damit Statusänderungen zeitnah gemeldet werden.

Der Broker verwendet unverschlüsseltes MQTT und sollte nur im vertrauenswürdigen lokalen Netzwerk erreichbar sein. Den Port nicht aus dem Internet freigeben. Welche Werte das jeweilige Klimagerät meldet, hängt von Modell und Firmware ab; neu empfangene Felder und Themen werden automatisch ergänzt.

## Versionsverlauf

Der Versionsverlauf steht in der [CHANGELOG.md](CHANGELOG.md).

## Lizenz

MIT. Siehe [LICENSE](LICENSE).
