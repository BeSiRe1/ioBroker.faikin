# Faikin

An ioBroker adapter for Daikin air conditioners using Faikin/Faikout firmware. It contains its own MQTT broker, so Faikin modules can connect directly to this adapter. One adapter instance can accept several modules; each module needs a unique MQTT hostname.

> **Development status:** 0.1.2 is an initial development version. It needs installation and real-device testing before it should be used on a production ioBroker system.

## Features

- Embedded MQTT broker with an editable port, bind address, and optional credentials.
- Automatic discovery of Faikin/Faikout hostnames and separate device folders.
- Dynamic datapoints for every status field and MQTT topic received from a device.
- Controls for power, target temperature, mode, fan, louvre swing, supported feature switches, auto mode, and schedules.
- Generic JSON control, arbitrary commands, and single or bulk settings.
- No dependency on the ioBroker MQTT adapter for Faikin connections.

## Installation from GitHub

Once this repository is public, install it in ioBroker Admin using **Adapters → Custom Install → Any URL** and enter:

`https://github.com/BeSiRe1/ioBroker.faikin`

The command line alternative is `iob url https://github.com/BeSiRe1/ioBroker.faikin`.

This direct GitHub installation is for testing. Inclusion in the official ioBroker adapter list is a separate later step.

## Configuration

1. Choose a free MQTT port. The default is `1884`, which can coexist with a broker already using `1883`.
2. Set a username and password; use the same credentials on every Faikin module.
3. In each module's MQTT settings, enter the ioBroker server's LAN address, the configured port, and the credentials.
4. Give each module a unique hostname. The adapter creates separate objects under `<hostname>.Status`, `<hostname>.Steuerung`, and `<hostname>.MQTT` when it receives that device's messages.

The broker uses unencrypted MQTT and should only be reachable on a trusted local network. Do not forward its port from the internet. The fields each air conditioner reports depend on its model and firmware; newly received fields and topics are added automatically.

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

Ein ioBroker-Adapter für Daikin-Klimaanlagen mit Faikin-/Faikout-Firmware. Der Adapter enthält einen eigenen MQTT-Broker, mit dem sich die Module direkt verbinden. Eine Adapterinstanz kann mehrere Module aufnehmen; jedes benötigt einen eigenen MQTT-Hostnamen.

> **Entwicklungsstand:** Version 0.1.2 ist eine erste Entwicklungsversion. Vor dem produktiven Einsatz muss sie installiert und mit echten Geräten geprüft werden.

## Funktionen

- Integrierter MQTT-Broker mit änderbarem Port, Bind-Adresse und optionalen Zugangsdaten.
- Automatische Erkennung von Faikin-/Faikout-Hostnamen mit getrennten Geräteordnern.
- Dynamische Datenpunkte für alle vom Gerät empfangenen Statusfelder und MQTT-Themen.
- Steuerung von Ein/Aus, Solltemperatur, Modus, Lüfter, Lamellen, unterstützten Zusatzfunktionen, Auto-Modus und Zeitplänen.
- Allgemeine JSON-Steuerung, freie Befehle und einzelne oder gebündelte Einstellungen.
- Der MQTT-Adapter ist für die Faikin-Verbindung nicht erforderlich.

## Installation von GitHub

Sobald dieses Repository öffentlich ist, lässt es sich im ioBroker Admin unter **Adapter → Benutzerdefinierte Installation → Beliebige URL** installieren. Dort die GitHub-Adresse von `ioBroker.faikin` eintragen.

Die direkte GitHub-Installation dient zunächst zum Testen. Eine Aufnahme in die offizielle ioBroker-Adapterliste ist ein späterer eigener Schritt.

## Einrichtung

1. Einen freien MQTT-Port festlegen. Standard ist `1884`, damit ein bereits auf Port `1883` laufender Broker daneben laufen kann.
2. Benutzername und Passwort setzen und dieselben Zugangsdaten in allen Faikin-Modulen eintragen.
3. In jedem Faikin-MQTT-Menü die LAN-Adresse des ioBroker-Servers, den Port und die Zugangsdaten eintragen.
4. Jedem Modul einen eigenen MQTT-Hostnamen geben. Für erkannte Geräte legt der Adapter unter `<hostname>.Status`, `<hostname>.Steuerung` und `<hostname>.MQTT` getrennte Objekte an.

Der Broker verwendet unverschlüsseltes MQTT und sollte nur im vertrauenswürdigen lokalen Netzwerk erreichbar sein. Den Port nicht aus dem Internet freigeben. Welche Werte das jeweilige Klimagerät meldet, hängt von Modell und Firmware ab; neu empfangene Felder und Themen werden automatisch ergänzt.

## Lizenz

MIT. Siehe [LICENSE](LICENSE).
