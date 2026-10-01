'use strict';

const { createServer } = require('node:net');
const utils = require('@iobroker/adapter-core');
const createBroker = require('aedes');

const STATUS_LABELS = {
    online: 'Online-Status', power: 'Ein/Aus', heat: 'Heizbetrieb aktiv', home: 'Raumtemperatur',
    outside: 'Außentemperatur', liquid: 'Kühlmittel-Vorlauftemperatur', comp: 'Kompressorleistung',
    fanrpm: 'Lüfterdrehzahl', mode: 'Betriebsmodus (Code)', mode_text: 'Betriebsmodus (Klartext)',
    temp: 'Solltemperatur', fan: 'Lüfterstufe (Code)', fan_text: 'Lüfterstufe (Klartext)',
    anglev: 'Lamellenwinkel vertikal', hum: 'Luftfeuchtigkeit', Whoutside: 'Energieverbrauch gesamt',
    Whheating: 'Energieverbrauch Heizen', Whcooling: 'Energieverbrauch Kühlen', consumption: 'Leistungsaufnahme',
    demand: 'Leistungsanforderung', swingh: 'Swing horizontal', swingv: 'Swing vertikal', econo: 'Economy-Modus',
    powerful: 'Powerful-Modus', comfort: 'Comfort-Modus', streamer: 'Streamer', sensor: 'Bewegungssensor',
    quiet: 'Silent-Modus', autor: 'Auto-Toleranz', autot: 'Auto-Zieltemperatur', auto0: 'Auto-Ausschaltzeit',
    auto1: 'Auto-Einschaltzeit', autop: 'Auto-Power', autoe: 'Zeitautomatik aktiviert', ts: 'Zeitstempel',
    protocol: 'Protokoll'
};
const ID_MAP = {
    online: 'Online', home: 'Raumtemperatur', outside: 'Aussentemperatur', liquid: 'Kuehlmittelvorlauf', comp: 'Kompressorleistung',
    fanrpm: 'Luefterdrehzahl', mode: 'Betriebsmodus', temp: 'Solltemperatur', fan: 'Luefterstufe',
    anglev: 'Lamellenwinkel_vertikal', Whoutside: 'Energieverbrauch_Gesamt', Whheating: 'Energieverbrauch_Heizen',
    Whcooling: 'Energieverbrauch_Kuehlen', consumption: 'Leistungsaufnahme', demand: 'Leistungsanforderung',
    swingh: 'Swing_horizontal', swingv: 'Swing_vertikal', econo: 'Economy_Modus', powerful: 'Powerful_Modus',
    comfort: 'Comfort_Modus', streamer: 'Streamer', sensor: 'Bewegungssensor', quiet: 'Silent_Modus',
    autor: 'Auto_Toleranz', autot: 'Auto_Zieltemperatur', auto0: 'Auto_Ausschaltzeit', auto1: 'Auto_Einschaltzeit',
    autop: 'Auto_Power', autoe: 'Zeitautomatik_aktiv', ts: 'Zeitstempel', protocol: 'Protokoll'
};
const UNITS = {
    home: '°C', outside: '°C', liquid: '°C', temp: '°C', autot: '°C', hum: '%', demand: '%',
    fanrpm: 'U/min', anglev: '°', Whoutside: 'Wh', Whheating: 'Wh', Whcooling: 'Wh', consumption: 'W'
};
const MODES = { H: 'Heizen', C: 'Kühlen', A: 'Auto', D: 'Trocknen', F: 'Nur Lüfter' };
const FANS = { A: 'Auto', Q: 'Nacht/Leise', '1': 'Stufe 1', '2': 'Stufe 2', '3': 'Stufe 3', '4': 'Stufe 4', '5': 'Stufe 5' };
const GENERAL_FOLDER = 'General';
const CONTROL_TO_FIELD = {
    SetPower: 'power', SetTemperature: 'temp', SetMode: 'mode', SetFan: 'fan', SetSwingHorizontal: 'swingh',
    SetSwingVertical: 'swingv', SetPowerful: 'powerful', SetEcono: 'econo', SetComfort: 'comfort',
    SetStreamer: 'streamer', SetQuiet: 'quiet', SetAutoOff: 'auto0', SetAutoOn: 'auto1',
    SetAutoEnabled: 'autoe', SetAutoPower: 'autop', SetAutoTarget: 'autot', SetAutoMargin: 'autor'
};
const FIELD_TO_CONTROL = Object.fromEntries(Object.entries(CONTROL_TO_FIELD).map(([control, field]) => [field, control]));
const DEFAULTS = {
    port: 1884, bind: '0.0.0.0', username: '', password: ''
};

class FaikinAdapter extends utils.Adapter {
    constructor(options = {}) {
        super({ ...options, name: 'faikin' });
        this.broker = null;
        this.server = null;
        this.pending = new Map();
        this.commandTimers = new Map();
        this.lastStatusPayload = new Map();
        this.deviceRoots = new Map();
        this.deviceSetups = new Map();
        this.rootHosts = new Map();
        this.on('ready', () => this.onReady());
        this.on('stateChange', (id, state) => this.onStateChange(id, state));
        this.on('unload', callback => this.onUnload(callback));
    }

    rootFor(hostname) { return hostname.replace(/[^a-zA-Z0-9_-]/g, '_'); }

    async onReady() {
        this.config = { ...DEFAULTS, ...this.config };
        await this.setObjectNotExistsAsync('info', { type: 'channel', common: { name: 'Information' }, native: {} });
        await this.setObjectNotExistsAsync('info.connection', { type: 'state', common: { name: 'MQTT-Client verbunden', type: 'boolean', role: 'indicator.reachable', read: true, write: false }, native: {} });
        await this.setStateAsync('info.connection', false, true);
        await this.removeEmptyLegacyDefaultDevice();
        await this.createGeneralFolder();
        this.subscribeStates('*');
        await this.startBroker();
        this.log.info(`Faikin-MQTT-Broker lauscht auf ${this.config.bind}:${this.config.port}; automatische Geräteerkennung aktiv.`);
    }

    async removeEmptyLegacyDefaultDevice() {
        const legacyHostname = String(this.config.hostname || 'Faikin').trim();
        const legacyId = this.rootFor(legacyHostname);
        const legacyObject = await this.getObjectAsync(legacyId);
        if (!legacyObject || legacyObject.type !== 'device') return;
        const onlineState = await this.getStateAsync(`${legacyId}.Status.Online`);
        if (!onlineState) await this.delObjectAsync(legacyId, { recursive: true });
    }

    async createGeneralFolder() {
        await this.setObjectNotExistsAsync(GENERAL_FOLDER, {
            type: 'folder', common: { name: 'General MQTT topics' }, native: {}
        });
        await this.setObjectNotExistsAsync(`${GENERAL_FOLDER}.MQTT`, {
            type: 'channel', common: { name: 'MQTT-Nachrichten' }, native: {}
        });
    }

    createObjects(hostname) {
        const pending = this.deviceSetups.get(hostname);
        if (pending) return pending;
        const setup = this.createDeviceObjects(hostname);
        this.deviceSetups.set(hostname, setup);
        return setup;
    }

    async createDeviceObjects(hostname) {
        if (this.deviceRoots.has(hostname)) return;
        const deviceId = this.rootFor(hostname);
        this.deviceRoots.set(hostname, deviceId);
        this.rootHosts.set(deviceId, hostname);
        await this.setObjectNotExistsAsync(deviceId, {
            type: 'device', common: { name: hostname, statusStates: { onlineId: 'Status.Online' } }, native: {}
        });
        await this.extendObjectAsync(deviceId, { common: { statusStates: { onlineId: 'Status.Online' } } });
        await this.setObjectNotExistsAsync(`${deviceId}.Status`, {
            type: 'channel', common: { name: 'Status' }, native: {}
        });
        await this.setObjectNotExistsAsync(`${deviceId}.Control`, {
            type: 'channel', common: { name: 'Control' }, native: {}
        });
        await this.setObjectNotExistsAsync(`${deviceId}.Commands`, {
            type: 'channel', common: { name: 'Commands' }, native: {}
        });
        await this.setObjectNotExistsAsync(`${deviceId}.MQTT`, {
            type: 'channel', common: { name: 'MQTT-Nachrichten' }, native: {}
        });
        await this.setObjectNotExistsAsync(`${deviceId}.Status.Online`, { type: 'state', common: { name: 'Online-Status Klimaanlage', type: 'boolean', role: 'indicator.reachable', read: true, write: false }, native: {} });
        await this.extendObjectAsync(`${deviceId}.Status.Online`, { common: { role: 'indicator.reachable' } });

        const controls = [
            ['SetPower', 'Klimaanlage Ein/Aus', 'boolean', 'switch', false],
            ['SetTemperature', 'Solltemperatur setzen', 'number', 'level.temperature', 22, '°C', 18, 30],
            ['SetMode', 'Betriebsmodus setzen', 'string', 'text', 'C'],
            ['SetFan', 'Lüfterstufe setzen', 'string', 'text', 'A'],
            ['SetSwingHorizontal', 'Swing horizontal setzen', 'boolean', 'switch', false],
            ['SetSwingVertical', 'Swing vertikal setzen', 'boolean', 'switch', false],
            ['SetPowerful', 'Powerful-Modus setzen', 'boolean', 'switch', false],
            ['SetEcono', 'Economy-Modus setzen', 'boolean', 'switch', false],
            ['SetComfort', 'Comfort-Modus setzen', 'boolean', 'switch', false],
            ['SetStreamer', 'Streamer setzen', 'boolean', 'switch', false],
            ['SetQuiet', 'Silent-Modus setzen', 'boolean', 'switch', false],
            ['SetAutoOff', 'Automatisches Ausschalten (HH:MM)', 'string', 'text', '00:00'],
            ['SetAutoOn', 'Automatisches Einschalten (HH:MM)', 'string', 'text', '00:00'],
            ['SetAutoEnabled', 'Faikin-Zeitautomatik aktivieren', 'boolean', 'switch', false],
            ['SetAutoPower', 'Temperaturabhängiges Ein/Aus', 'boolean', 'switch', false],
            ['SetAutoTarget', 'Auto-Zieltemperatur', 'number', 'level.temperature', 22, '°C'],
            ['SetAutoMargin', 'Auto-Toleranz', 'number', 'level', 0.5, '°C']
        ];
        for (const [id, name, type, role, def, unit, min, max] of controls) {
            const common = { name, type, role, read: true, write: true, def };
            if (unit) common.unit = unit;
            if (min !== undefined) common.min = min;
            if (max !== undefined) common.max = max;
            if (id === 'SetMode') common.states = MODES;
            if (id === 'SetFan') common.states = FANS;
            await this.setObjectNotExistsAsync(`${deviceId}.Control.${id}`, { type: 'state', common, native: {} });
        }
        const commands = [
            ['PowerOn', 'Einschalten (Taster)', 'boolean', 'button', false],
            ['PowerOff', 'Ausschalten (Taster)', 'boolean', 'button', false],
            ['RequestStatus', 'Status anfordern (Taster)', 'boolean', 'button', false],
            ['Restart', 'Faikin-Modul neu starten (Taster)', 'boolean', 'button', false],
            ['SettingsRequest', 'Faikin-Einstellungen abrufen (Taster)', 'boolean', 'button', false]
        ];
        for (const [id, name, type, role, def] of commands) {
            const common = { name, type, role, read: true, write: true, def };
            await this.setObjectNotExistsAsync(`${deviceId}.Commands.${id}`, { type: 'state', common, native: {} });
        }
        const generic = [
            ['ControlJSON', 'Zusätzlicher JSON-Steuerbefehl', 'string', 'text'],
            ['SettingJSON', 'Faikin-Einstellungen als JSON setzen', 'string', 'text'],
            ['CommandTopic', 'Beliebigen Faikin-Befehl senden (Topic-Endung)', 'string', 'text'],
            ['CommandPayload', 'Nutzlast für den beliebigen Befehl', 'string', 'text'],
            ['SettingName', 'Name einer einzelnen Einstellung', 'string', 'text'],
            ['SettingValue', 'Wert der einzelnen Einstellung', 'string', 'text']
        ];
        for (const [id, name, type, role] of generic) {
            await this.setObjectNotExistsAsync(`${deviceId}.Commands.${id}`, { type: 'state', common: { name, type, role, read: true, write: true }, native: {} });
        }
        await this.delObjectAsync(`${deviceId}.Steuerung`, { recursive: true });
    }

    async startBroker() {
        const port = Number(this.config.port);
        if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Ungültiger MQTT-Port: ${this.config.port}`);
        this.broker = createBroker({ authenticate: (client, username, password, callback) => {
            const expectedUser = String(this.config.username || '');
            const expectedPassword = String(this.config.password || '');
            const suppliedUser = username ? username.toString() : '';
            const suppliedPassword = password ? password.toString() : '';
            if ((expectedUser && suppliedUser !== expectedUser) || (expectedPassword && suppliedPassword !== expectedPassword)) {
                return callback(new Error('MQTT-Anmeldung abgelehnt'));
            }
            callback(null, true);
        } });
        this.server = createServer(this.broker.handle);
        this.clients = new Set();
        this.broker.on('clientReady', client => {
            this.clients.add(client.id);
            this.log.info(`MQTT-Client verbunden: ${client.id}`);
            this.setState('info.connection', true, true);
        });
        this.broker.on('clientDisconnect', client => {
            this.clients.delete(client.id);
            this.log.info(`MQTT-Client getrennt: ${client.id}`);
            this.setState('info.connection', this.clients.size > 0, true);
        });
        this.broker.on('publish', (packet, client) => {
            if (!client || !packet.topic || packet.topic.startsWith('$SYS/')) return;
            this.handleIncoming(packet.topic, packet.payload ? packet.payload.toString() : '')
                .catch(error => this.log.error(`MQTT-Thema ${packet.topic}: ${error.message || error}`));
        });
        await new Promise((resolve, reject) => {
            const onError = error => { this.server.removeListener('listening', onListening); reject(error); };
            const onListening = () => { this.server.removeListener('error', onError); resolve(); };
            this.server.once('error', onError);
            this.server.once('listening', onListening);
            this.server.listen(port, this.config.bind || DEFAULTS.bind);
        });
    }

    async handleIncoming(topic, payload) {
        const parts = topic.split('/');
        const topicFamilies = ['state', 'setting', 'command', 'info', 'event', 'error', 'Faikout'];
        const hostname = topicFamilies.includes(parts[0]) && parts.length > 1 ? parts[1] : null;
        if (hostname) await this.createObjects(hostname);
        const root = hostname ? this.rootFor(hostname) : GENERAL_FOLDER;
        const devicePrefix = hostname ? `state/${hostname}` : null;
        if (devicePrefix && (topic === devicePrefix || topic === `${devicePrefix}/status`)) {
            if (payload === 'true' || payload === 'false') {
                await this.setStateAsync(`${root}.Status.Online`, payload === 'true', true);
                return;
            }
            if (payload === this.lastStatusPayload.get(hostname)) return;
            await this.setStateAsync(`${root}.Status.Online`, true, true);
            let data;
            try { data = JSON.parse(payload); } catch { data = payload; }
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                for (const [key, value] of Object.entries(data)) {
                    await this.writeStatusValue(hostname, key, value);
                }
                this.lastStatusPayload.set(hostname, payload);
            } else {
                await this.writeValue(`${root}.Status.Payload`, payload, 'Status-Nutzlast', 'string');
            }
            return;
        }
        if (devicePrefix && topic.startsWith(`${devicePrefix}/`)) {
            const key = topic.slice(devicePrefix.length + 1).replaceAll('/', '.');
            await this.setStateAsync(`${root}.Status.Online`, true, true);
            if (key === 'online') {
                await this.setStateAsync(`${root}.Status.Online`, this.parseValue(payload) === true, true);
                return;
            }
            await this.writeValue(`${root}.Status.${key}`, this.parseValue(payload), STATUS_LABELS[key] || key);
            return;
        }
        const families = ['info', 'event', 'error', 'Faikout'];
        for (const family of hostname ? families : []) {
            const prefix = `${family}/${hostname}`;
            if (topic === prefix || topic.startsWith(`${prefix}/`)) {
                const name = `${family}.${topic.slice(prefix.length).replace(/^\//, '').replaceAll('/', '.') || 'message'}`;
                await this.writeValue(`${root}.MQTT.${name}`, this.parseValue(payload), topic);
                return;
            }
        }
        if (hostname && topic.startsWith('setting/')) {
            const prefix = `setting/${hostname}`;
            if (topic === prefix || topic.startsWith(`${prefix}/`)) {
                const suffix = topic.slice(prefix.length).replace(/^\//, '').replaceAll('/', '.') || 'Current';
                await this.writeValue(`${root}.MQTT.Settings.${suffix}`, this.parseValue(payload), `Faikin-Einstellung ${suffix}`);
                return;
            }
        }
        const safeTopic = topic.split('/').map(part => part.replace(/[^a-zA-Z0-9_-]/g, '_')).join('.');
        await this.writeValue(`${root}.MQTT.Eingehend.${safeTopic}`, this.parseValue(payload), topic);
    }

    parseValue(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value !== '' && !Number.isNaN(Number(value))) return Number(value);
        try {
            const parsed = JSON.parse(value);
            return parsed !== null && typeof parsed === 'object' ? JSON.stringify(parsed) : parsed;
        } catch { return value; }
    }

    async writeStatusValue(hostname, key, value) {
        const root = this.rootFor(hostname);
        const idName = ID_MAP[key] || key.replace(/[^a-zA-Z0-9_-]/g, '_');
        const label = STATUS_LABELS[key] || key;
        const unit = UNITS[key];
        const id = `${root}.Status.${idName}`;
        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) await this.writeValue(`${id}.${i}`, value[i], `${label} ${i + 1}`, unit);
        } else if (value !== null && typeof value === 'object') {
            for (const [child, childValue] of Object.entries(value)) await this.writeValue(`${id}.${child}`, childValue, `${label} ${child}`, unit);
        } else {
            await this.writeValue(id, value, label, unit);
            if (key === 'mode' && MODES[value]) await this.writeValue(`${root}.Status.Betriebsmodus_Text`, MODES[value], 'Betriebsmodus');
            if (key === 'fan' && FANS[value]) await this.writeValue(`${root}.Status.Luefterstufe_Text`, FANS[value], 'Lüfterstufe');
            const controlId = FIELD_TO_CONTROL[key];
            if (controlId) {
                const pendingKey = `${hostname}:${controlId}`;
                const pending = this.pending.get(pendingKey);
                if (pending && Date.now() < pending.expires && pending.value !== value) return;
                if (pending && pending.value === value) this.pending.delete(pendingKey);
                await this.setStateAsync(`${root}.Control.${controlId}`, value, true);
            }
        }
    }

    async writeValue(id, value, name, unit) {
        const type = typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string';
        let common = { name: name || id.split('.').pop(), type, role: type === 'boolean' ? 'indicator' : type === 'number' ? 'value' : 'text', read: true, write: false };
        if (unit) common.unit = unit;
        await this.setObjectNotExistsAsync(id, { type: 'state', common, native: {} });
        const current = await this.getStateAsync(id);
        if (!current || current.val !== value || current.ack !== true) await this.setStateAsync(id, value, true);
    }

    onStateChange(id, state) {
        if (!state || state.ack || !id.startsWith(`${this.namespace}.`)) return;
        const relative = id.slice(`${this.namespace}.`.length);
        const controlMarker = '.Control.';
        const commandMarker = '.Commands.';
        const marker = relative.includes(controlMarker) ? controlMarker : relative.includes(commandMarker) ? commandMarker : null;
        if (!marker) return;
        const markerIndex = relative.indexOf(marker);
        const root = relative.slice(0, markerIndex);
        const hostname = this.rootHosts.get(root);
        if (!hostname) return;
        const key = relative.slice(markerIndex + marker.length);
        this.handleControlChange(hostname, key, state.val).catch(error => this.log.error(`Steuerung ${hostname}/${key}: ${error.message || error}`));
    }

    async handleControlChange(hostname, key, value) {
        if (CONTROL_TO_FIELD[key]) {
            const field = CONTROL_TO_FIELD[key];
            const timerKey = `${hostname}:${key}`;
            this.pending.set(timerKey, { value, expires: Date.now() + 10000 });
            if (field === 'power') return this.publishCommand(hostname, value ? 'on' : 'off');
            this.publishCommand(hostname, 'status').catch(error => this.log.error(`Statusabfrage ${hostname}: ${error.message || error}`));
            const prior = this.commandTimers.get(timerKey);
            if (prior) clearTimeout(prior);
            const timer = setTimeout(() => {
                this.commandTimers.delete(timerKey);
                this.publishControl(hostname, { [field]: value }).catch(error => this.log.error(`MQTT-Steuerbefehl ${field}: ${error.message || error}`));
            }, 1500);
            this.commandTimers.set(timerKey, timer);
            return;
        }
        if (key === 'PowerOn' && value) await this.publishCommand(hostname, 'on');
        else if (key === 'PowerOff' && value) await this.publishCommand(hostname, 'off');
        else if (key === 'RequestStatus' && value) await this.publishCommand(hostname, 'status');
        else if (key === 'Restart' && value) await this.publishCommand(hostname, 'restart');
        else if (key === 'SettingsRequest' && value) await this.publish(`setting/${hostname}`, '');
        else if (key === 'ControlJSON') {
            const parsed = this.parseJsonObject(value, key);
            if (parsed) await this.publishControl(hostname, parsed);
        } else if (key === 'SettingJSON') {
            const parsed = this.parseJsonObject(value, key);
            if (parsed) await this.publish(`setting/${hostname}`, JSON.stringify(parsed));
        } else if (key === 'CommandTopic') {
            if (value) this.log.debug(`Befehlsthema ${value} gespeichert; Nutzlast über CommandPayload senden.`);
        } else if (key === 'CommandPayload') {
            const command = await this.getStateAsync(`${this.rootFor(hostname)}.Commands.CommandTopic`);
            if (command && command.val) await this.publish(`command/${hostname}/${String(command.val).replace(/^command\//, '').replace(`${hostname}/`, '')}`, String(value ?? ''));
        } else if (key === 'SettingName') {
            this.log.debug('Einstellungsname bereit; nachfolgende Änderung an SettingValue sendet den Wert.');
        } else if (key === 'SettingValue') {
            const setting = await this.getStateAsync(`${this.rootFor(hostname)}.Commands.SettingName`);
            if (setting && setting.val) await this.publish(`setting/${hostname}/${setting.val}`, String(value ?? ''));
        }
        if (['PowerOn', 'PowerOff', 'RequestStatus', 'Restart', 'SettingsRequest'].includes(key) && value) {
            await this.setStateAsync(`${this.rootFor(hostname)}.Commands.${key}`, false, true);
        }
    }

    parseJsonObject(value, key) {
        try {
            const parsed = JSON.parse(String(value));
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('JSON muss ein Objekt sein.');
            return parsed;
        } catch (error) {
            this.log.warn(`${key}: ungültiges JSON: ${error.message}`);
            return null;
        }
    }

    publishControl(hostname, fields) { return this.publish(`command/${hostname}/control`, JSON.stringify(fields)); }
    publishCommand(hostname, command, payload = '') { return this.publish(`command/${hostname}/${command}`, payload); }

    publish(topic, payload) {
        if (!this.broker) return Promise.reject(new Error('MQTT-Broker ist nicht gestartet.'));
        return new Promise((resolve, reject) => {
            this.broker.publish({ topic, payload: Buffer.from(String(payload)), qos: 0, retain: false }, error => {
                if (error) return reject(error);
                this.log.info(`MQTT gesendet: ${topic}${payload ? ` ${payload}` : ''}`);
                resolve();
            });
        });
    }

    onUnload(callback) {
        for (const timer of this.commandTimers.values()) clearTimeout(timer);
        this.commandTimers.clear();
        const finish = () => {
            if (this.broker) this.broker.close(() => callback());
            else callback();
        };
        if (this.server && this.server.listening) this.server.close(finish);
        else finish();
    }
}

if (module.parent) module.exports = options => new FaikinAdapter(options);
else new FaikinAdapter();
