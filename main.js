'use strict';

const { createServer } = require('node:net');
const utils = require('@iobroker/adapter-core');
const createBroker = require('aedes');

const STATUS_LABELS = {
    online: 'Klimaanlage erreichbar', power: 'Klimaanlage Ein/Aus', heat: 'Heizbetrieb aktiv', home: 'Raumtemperatur',
    outside: 'Außentemperatur', liquid: 'Kühlmittel-Vorlauftemperatur', inlet: 'Ansauglufttemperatur',
    comp: 'Kompressorfrequenz', fanrpm: 'Lüfterdrehzahl', mode: 'Betriebsmodus (Code)', mode_text: 'Betriebsmodus',
    temp: 'Solltemperatur', fan: 'Lüfterstufe (Code)', fan_text: 'Lüfterstufe', anglev: 'Vertikaler Lamellenwinkel',
    hum: 'Raumluftfeuchtigkeit', Whoutside: 'Energieverbrauch gesamt', Whheating: 'Energieverbrauch Heizen',
    Whcooling: 'Energieverbrauch Kühlen', consumption: 'Leistungsaufnahme', demand: 'Leistungsanforderung',
    swingh: 'Horizontales Schwingen', swingv: 'Vertikales Schwingen', econo: 'Energiesparmodus',
    powerful: 'Powerful-Modus', comfort: 'Comfort-Modus', streamer: 'Streamer-/Luftreinigungsfunktion',
    sensor: 'Sensorfunktion', led: 'Anzeige-LED', humidify: 'Befeuchtungsmodus', preset: 'Voreinstellung',
    quiet: 'Quiet-/Leise-Modus', autor: 'Auto-Toleranz', autot: 'Auto-Zieltemperatur',
    auto0: 'Auto-Ausschaltzeit', auto1: 'Auto-Einschaltzeit', autop: 'Automatisches Ein/Aus',
    autoe: 'Automatik aktiviert', env: 'Referenztemperatur', slave: 'Heiz-/Kühlmodus nicht führend',
    antifreeze: 'Frostschutzbetrieb aktiv', model: 'Klimaanlagenmodell'
};
const INFO_LABELS = {
    app: 'Anwendungsname', bssid: 'WLAN-BSSID', build: 'Firmware-Buildzeit', 'build-suffix': 'Firmware-Buildvariante',
    chan: 'WLAN-Kanal', control: 'Externe/automatische Steuerung aktiv',
    flash: 'Flash-Größe', id: 'Geräte-ID', ipv4: 'IPv4-Adresse', ipv6: 'IPv6-Adresse',
    mem: 'Freier Speicher', 'mqtt-up': 'MQTT-Laufzeit', protocol: 'Kommunikationsprotokoll',
    rst: 'Neustartcode', rssi: 'WLAN-Signalstärke', spi: 'Freier SPI-Speicher', ssid: 'WLAN-Name (SSID)',
    ts: 'Zeitstempel (Faikin)', uptime: 'Betriebszeit', version: 'Firmware-Version',
    online: 'Klimaanlage erreichbar'
};
const INFO_ID_MAP = {
    app: 'application_name', bssid: 'wifi_bssid', build: 'firmware_build_time', 'build-suffix': 'firmware_build_variant',
    chan: 'wifi_channel', control: 'external_control_active', ipv4: 'ipv4_address', ipv6: 'ipv6_address',
    protocol: 'communication_protocol', ts: 'timestamp', rssi: 'wifi_signal_strength', ssid: 'wifi_ssid',
    uptime: 'uptime_seconds', version: 'firmware_version', 'mqtt-up': 'mqtt_uptime_seconds',
    flash: 'flash_size', id: 'device_id', mem: 'free_memory', rst: 'restart_code', spi: 'free_spi_memory',
    online: 'air_conditioner_reachable'
};
const INFO_FIELDS = new Set([
    'app', 'bssid', 'build', 'build-suffix', 'chan', 'control', 'flash', 'id', 'ipv4', 'ipv6', 'mem',
    'mqtt-up', 'protocol', 'rst', 'rssi', 'spi', 'ssid', 'ts', 'uptime', 'version'
]);
const ID_MAP = {
    online: 'air_conditioner_reachable', power: 'power', heat: 'heating_active', home: 'room_temperature',
    outside: 'outside_temperature', liquid: 'coolant_feed_temperature', inlet: 'intake_air_temperature',
    comp: 'compressor_frequency', fanrpm: 'fan_speed_rpm', mode: 'operating_mode', mode_text: 'operating_mode_text',
    temp: 'target_temperature', fan: 'fan_level', fan_text: 'fan_level_text', hum: 'humidity',
    anglev: 'vertical_louvre_angle', Whoutside: 'energy_consumption_total',
    Whheating: 'energy_consumption_heating', Whcooling: 'energy_consumption_cooling',
    consumption: 'power_consumption', demand: 'power_demand', swingh: 'horizontal_swing',
    swingv: 'vertical_swing', econo: 'economy_mode', powerful: 'powerful_mode', comfort: 'comfort_mode',
    streamer: 'streamer', sensor: 'sensor_function', led: 'display_led', humidify: 'humidification_mode',
    preset: 'preset', quiet: 'quiet_mode', autor: 'auto_tolerance',
    autot: 'auto_target_temperature', auto0: 'auto_off_time', auto1: 'auto_on_time',
    autop: 'automatic_power', autoe: 'automation_enabled', env: 'reference_temperature',
    slave: 'slave', antifreeze: 'antifreeze_mode', model: 'air_conditioner_model', ts: 'timestamp', protocol: 'protocol'
};
const UNITS = {
    home: '°C', outside: '°C', liquid: '°C', inlet: '°C', temp: '°C', autot: '°C', autor: '°C', env: '°C',
    comp: 'Hz', hum: '%', demand: '%', rssi: 'dBm', uptime: 's', 'mqtt-up': 's', fanrpm: 'U/min', anglev: '°',
    flash: 'B', mem: 'B', spi: 'B', Whoutside: 'Wh', Whheating: 'Wh', Whcooling: 'Wh', consumption: 'W'
};
const MODES = { H: 'Heizen', C: 'Kühlen', A: 'Auto', D: 'Trocknen', F: 'Nur Lüfter' };
const FANS = { A: 'Auto', Q: 'Nacht/Leise', '1': 'Stufe 1', '2': 'Stufe 2', '3': 'Stufe 3', '4': 'Stufe 4', '5': 'Stufe 5' };
const GENERAL_FOLDER = 'General';
const CONTROL_TO_FIELD = {
    power: 'power', target_temperature: 'temp', operating_mode: 'mode', fan_speed: 'fan',
    horizontal_swing: 'swingh', vertical_swing: 'swingv', powerful_mode: 'powerful', economy_mode: 'econo',
    comfort_mode: 'comfort', streamer: 'streamer', quiet_mode: 'quiet', auto_off_time: 'auto0', auto_on_time: 'auto1',
    auto_schedule_enabled: 'autoe', temperature_dependent_power: 'autop', auto_target_temperature: 'autot',
    auto_tolerance: 'autor', preset: 'preset', demand_control: 'demand', sensor_function: 'sensor',
    display_led: 'led', humidification_mode: 'humidify'
};
const FIELD_TO_CONTROL = Object.fromEntries(Object.entries(CONTROL_TO_FIELD).map(([control, field]) => [field, control]));
const CONTROL_DEFINITIONS = {
    power: ['Klimaanlage Ein/Aus', 'boolean', 'switch', false],
    target_temperature: ['Solltemperatur setzen', 'number', 'level.temperature', 22, '°C'],
    operating_mode: ['Betriebsmodus setzen', 'string', 'text', 'C'],
    fan_speed: ['Lüfterstufe setzen', 'string', 'text', 'A'],
    horizontal_swing: ['Swing horizontal setzen', 'boolean', 'switch', false],
    vertical_swing: ['Swing vertikal setzen', 'boolean', 'switch', false],
    powerful_mode: ['Powerful-Modus setzen', 'boolean', 'switch', false],
    economy_mode: ['Economy-Modus setzen', 'boolean', 'switch', false],
    comfort_mode: ['Comfort-Modus setzen', 'boolean', 'switch', false],
    streamer: ['Streamer-/Luftreinigungsfunktion setzen', 'boolean', 'switch', false],
    quiet_mode: ['Quiet-/Leise-Modus setzen', 'boolean', 'switch', false],
    auto_off_time: ['Automatisches Ausschalten (HH:MM)', 'string', 'text', '00:00'],
    auto_on_time: ['Automatisches Einschalten (HH:MM)', 'string', 'text', '00:00'],
    auto_schedule_enabled: ['Faikin-Zeitautomatik aktivieren', 'boolean', 'switch', false],
    temperature_dependent_power: ['Temperaturabhängiges Ein/Aus', 'boolean', 'switch', false],
    auto_target_temperature: ['Auto-Zieltemperatur', 'number', 'level.temperature', 22, '°C'],
    auto_tolerance: ['Auto-Toleranz', 'number', 'level', 0.5, '°C'],
    preset: ['Voreinstellung', 'string', 'state', 'home'],
    demand_control: ['Leistungsbegrenzung', 'number', 'level', 100, '%', 30, 100, 5],
    sensor_function: ['Anwesenheitssensor', 'boolean', 'switch', false],
    display_led: ['Anzeige-LED', 'boolean', 'switch', false],
    humidification_mode: ['Befeuchtung', 'string', 'text', 'off']
};
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
        this.controlObjects = new Set();
        this.temperatureRanges = new Map();
        this.on('ready', () => this.onReady());
        this.on('stateChange', (id, state) => this.onStateChange(id, state));
        this.on('unload', callback => this.onUnload(callback));
    }

    rootFor(hostname) { return hostname.replace(/[^a-zA-Z0-9_-]/g, '_'); }

    async onReady() {
        this.config = { ...DEFAULTS, ...this.config };
        await this.setObjectNotExistsAsync('info', { type: 'channel', common: { name: 'Information' }, native: {} });
        await this.setObjectNotExistsAsync('info.connection', { type: 'state', common: { name: 'Liste der verbundenen Clients', type: 'string', role: 'text', read: true, write: false, def: '' }, native: {} });
        await this.extendObjectAsync('info.connection', { common: { name: 'Liste der verbundenen Clients', type: 'string', role: 'text', read: true, write: false } });
        await this.setStateAsync('info.connection', '', true);
        await this.createGeneralFolder();
        this.subscribeStates('*');
        await this.startBroker();
        this.log.info(`Faikin-MQTT-Broker lauscht auf ${this.config.bind}:${this.config.port}; automatische Geräteerkennung aktiv.`);
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
            type: 'device', common: { name: hostname, statusStates: { onlineId: 'Info.module_online' } }, native: {}
        });
        await this.extendObjectAsync(deviceId, { common: { statusStates: { onlineId: 'Info.module_online' } } });
        await this.setObjectNotExistsAsync(`${deviceId}.Status`, {
            type: 'channel', common: { name: 'Status' }, native: {}
        });
        await this.setObjectNotExistsAsync(`${deviceId}.Info`, {
            type: 'channel', common: { name: 'Info' }, native: {}
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
        await this.setObjectNotExistsAsync(`${deviceId}.Info.module_online`, { type: 'state', common: { name: 'Faikin-Modul online', type: 'boolean', role: 'indicator.reachable', read: true, write: false }, native: {} });
        await this.extendObjectAsync(`${deviceId}.Info.module_online`, { common: { name: 'Faikin-Modul online', role: 'indicator.reachable' } });
        await this.setObjectNotExistsAsync(`${deviceId}.Status.air_conditioner_reachable`, { type: 'state', common: { name: STATUS_LABELS.online, type: 'boolean', role: 'indicator', read: true, write: false }, native: {} });
        await this.extendObjectAsync(`${deviceId}.Status.air_conditioner_reachable`, { common: { name: STATUS_LABELS.online } });
        const commands = [
            ['power_on', 'Einschalten (Taster)', 'boolean', 'button', false],
            ['power_off', 'Ausschalten (Taster)', 'boolean', 'button', false],
            ['request_status', 'Status anfordern (Taster)', 'boolean', 'button', false],
            ['restart', 'Faikin-Modul neu starten (Taster)', 'boolean', 'button', false],
            ['request_settings', 'Faikin-Einstellungen abrufen (Taster)', 'boolean', 'button', false]
        ];
        for (const [id, name, type, role, def] of commands) {
            const common = { name, type, role, read: true, write: true, def };
            await this.setObjectNotExistsAsync(`${deviceId}.Commands.${id}`, { type: 'state', common, native: {} });
        }
        const generic = [
            ['control_json', 'Zusätzlicher JSON-Steuerbefehl', 'string', 'text'],
            ['setting_json', 'Faikin-Einstellungen als JSON setzen', 'string', 'text'],
            ['command_topic', 'Beliebigen Faikin-Befehl senden (Topic-Endung)', 'string', 'text'],
            ['command_payload', 'Nutzlast für den beliebigen Befehl', 'string', 'text'],
            ['setting_name', 'Name einer einzelnen Einstellung', 'string', 'text'],
            ['setting_value', 'Wert der einzelnen Einstellung', 'string', 'text']
        ];
        for (const [id, name, type, role] of generic) {
            await this.setObjectNotExistsAsync(`${deviceId}.Commands.${id}`, { type: 'state', common: { name, type, role, read: true, write: true }, native: {} });
        }
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
        this.clients = new Map();
        this.broker.on('clientReady', client => {
            this.clients.set(client.id, null);
            this.log.info(`MQTT-Client verbunden: ${client.id}`);
            this.updateConnectedClientsState();
        });
        this.broker.on('clientDisconnect', client => {
            this.handleClientDisconnect(client).catch(error => this.log.error(`MQTT-Trennung ${client.id}: ${error.message || error}`));
        });
        this.broker.on('publish', (packet, client) => {
            if (!client || !packet.topic || packet.topic.startsWith('$SYS/')) return;
            this.handleIncoming(packet.topic, packet.payload ? packet.payload.toString() : '', client.id)
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

    updateConnectedClientsState() {
        if (!this.clients) return;
        const hostnames = [...new Set([...this.clients.values()].filter(Boolean))].sort((a, b) => a.localeCompare(b));
        this.setState('info.connection', hostnames.join(', '), true);
    }

    async handleClientDisconnect(client) {
        const hostname = this.clients?.get(client.id);
        this.clients?.delete(client.id);
        this.log.info(`MQTT-Client getrennt: ${client.id}`);
        this.updateConnectedClientsState();
        if (hostname && ![...this.clients.values()].includes(hostname)) await this.setModuleOnline(hostname, false);
    }

    async setModuleOnline(hostname, online) {
        await this.createObjects(hostname);
        const root = this.rootFor(hostname);
        await this.setStateAsync(`${root}.Info.module_online`, online, true);
        if (!online) await this.setStateAsync(`${root}.Status.air_conditioner_reachable`, false, true);
    }

    async handleIncoming(topic, payload, clientId) {
        if (topic.endsWith('/config')) {
            await this.handleClimateDiscovery(payload);
        }
        const parts = topic.split('/');
        const topicFamilies = ['state', 'setting', 'command', 'info', 'event', 'error', 'Faikout'];
        const hostname = topicFamilies.includes(parts[0]) && parts.length > 1 ? parts[1] : null;
        if (hostname && clientId && this.clients?.has(clientId) && this.clients.get(clientId) !== hostname) {
            this.clients.set(clientId, hostname);
            this.updateConnectedClientsState();
        }
        if (hostname) await this.createObjects(hostname);
        if (clientId && this.clients && !this.clients.has(clientId)) return;
        const root = hostname ? this.rootFor(hostname) : GENERAL_FOLDER;
        const devicePrefix = hostname ? `state/${hostname}` : null;
        if (devicePrefix && (topic === devicePrefix || topic === `${devicePrefix}/status`)) {
            if (payload === 'true' || payload === 'false') {
                if (payload === 'false') await this.setModuleOnline(hostname, false);
                return;
            }
            if (payload === this.lastStatusPayload.get(hostname)) return;
            let data;
            try { data = JSON.parse(payload); } catch { data = payload; }
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                const entries = Object.entries(data).sort(([a], [b]) => a === 'up' ? -1 : b === 'up' ? 1 : 0);
                for (const [key, value] of entries) {
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
            await this.writeStatusValue(hostname, key, this.parseValue(payload));
            return;
        }
        const families = ['info', 'event', 'error', 'Faikout'];
        for (const family of hostname ? families : []) {
            const prefix = `${family}/${hostname}`;
            if (topic === prefix || topic.startsWith(`${prefix}/`)) {
                const suffix = topic.slice(prefix.length).replace(/^\//, '').replaceAll('/', '.') || 'message';
                if (family === 'info') {
                    const statusKey = suffix.split('.').pop();
                    if (statusKey === 'up' || statusKey === 'online') {
                        const value = this.parseValue(payload);
                        if (statusKey === 'up') {
                            if (typeof value === 'boolean') await this.setModuleOnline(hostname, value);
                            else if (value === 0 || value === 1) await this.setModuleOnline(hostname, value === 1);
                        } else if (typeof value === 'boolean') {
                            await this.writeInfoValue(hostname, suffix, value, topic);
                            const root = this.rootFor(hostname);
                            if (!value) {
                                await this.setStateAsync(`${root}.Status.air_conditioner_reachable`, false, true);
                            } else {
                                const moduleState = await this.getStateAsync(`${root}.Info.module_online`);
                                if (moduleState?.val === true) await this.setStateAsync(`${root}.Status.air_conditioner_reachable`, true, true);
                            }
                        }
                        return;
                    }
                    await this.writeInfoValue(hostname, suffix, this.parseValue(payload), topic);
                } else {
                    const name = `${family}.${suffix}`;
                    await this.writeValue(`${root}.MQTT.${name}`, this.parseValue(payload), topic);
                }
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

    async handleClimateDiscovery(payload) {
        let discovery;
        try { discovery = JSON.parse(payload); } catch { return; }
        const availabilityTopic = discovery.avty_t || discovery.availability_topic;
        const match = typeof availabilityTopic === 'string' && availabilityTopic.match(/^state\/([^/]+)(?:\/|$)/);
        if (!match) return;
        const min = Number(discovery.min_temp);
        const max = Number(discovery.max_temp);
        const step = Number(discovery.temp_step);
        if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max || !Number.isFinite(step) || step <= 0) return;
        const hostname = match[1];
        this.temperatureRanges.set(hostname, { min, max, step });
        await this.createObjects(hostname);
        await this.applyTemperatureRange(hostname);
        this.log.info(`${hostname}: Solltemperaturbereich ${min}–${max} °C, Schrittweite ${step} °C aus MQTT-Erkennung übernommen.`);
    }

    async applyTemperatureRange(hostname) {
        const range = this.temperatureRanges.get(hostname);
        if (!range) return;
        const id = `${this.rootFor(hostname)}.Control.target_temperature`;
        const object = await this.getObjectAsync(id);
        if (object) await this.extendObjectAsync(id, { common: range });
    }

    async ensureControlObject(hostname, controlId) {
        const definition = CONTROL_DEFINITIONS[controlId];
        if (!definition) return;
        const id = `${this.rootFor(hostname)}.Control.${controlId}`;
        if (this.controlObjects.has(id)) return;
        const [name, type, role, def, unit, min, max, step] = definition;
        const common = { name, type, role, read: true, write: true, def };
        if (unit) common.unit = unit;
        if (min !== undefined) common.min = min;
        if (max !== undefined) common.max = max;
        if (step !== undefined) common.step = step;
        if (controlId === 'operating_mode') common.states = MODES;
        if (controlId === 'fan_speed') common.states = FANS;
        if (controlId === 'preset') common.states = { home: 'Zuhause', eco: 'Sparbetrieb', boost: 'Boost' };
        if (controlId === 'target_temperature') Object.assign(common, this.temperatureRanges.get(hostname) || {});
        await this.setObjectNotExistsAsync(id, { type: 'state', common, native: { field: CONTROL_TO_FIELD[controlId] } });
        await this.extendObjectAsync(id, { common });
        this.controlObjects.add(id);
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
        if (key === 'up') {
            if (typeof value === 'boolean') await this.setModuleOnline(hostname, value);
            else if (value === 0 || value === 1) await this.setModuleOnline(hostname, value === 1);
            return;
        }
        if (INFO_FIELDS.has(key)) {
            await this.writeInfoValue(hostname, key, value, `state/${hostname}/${key}`);
            return;
        }
        const root = this.rootFor(hostname);
        if (key === 'online' && value === true) {
            const moduleState = await this.getStateAsync(`${root}.Info.module_online`);
            if (!moduleState || moduleState.val !== true) return;
        }
        const idName = ID_MAP[key] || INFO_ID_MAP[key] || key.replace(/[^a-zA-Z0-9_-]/g, '_');
        const label = STATUS_LABELS[key] || INFO_LABELS[key] || key;
        const unit = UNITS[key];
        const id = `${root}.Status.${idName}`;
        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) await this.writeValue(`${id}.${i}`, value[i], `${label} ${i + 1}`, unit);
        } else if (value !== null && typeof value === 'object') {
            for (const [child, childValue] of Object.entries(value)) await this.writeValue(`${id}.${child}`, childValue, `${label} ${child}`, unit);
        } else {
            await this.writeValue(id, value, label, unit);
            if (key === 'mode' && MODES[value]) await this.writeValue(`${root}.Status.mode_text`, MODES[value], 'Betriebsmodus (Klartext)');
            if (key === 'fan' && FANS[value]) await this.writeValue(`${root}.Status.fan_text`, FANS[value], 'Lüfterstufe (Klartext)');
            const controlId = FIELD_TO_CONTROL[key];
            if (controlId) {
                await this.ensureControlObject(hostname, controlId);
                const pendingKey = `${hostname}:${controlId}`;
                const pending = this.pending.get(pendingKey);
                if (pending && Date.now() < pending.expires && pending.value !== value) return;
                if (pending && pending.value === value) this.pending.delete(pendingKey);
                await this.setStateAsync(`${root}.Control.${controlId}`, value, true);
            }
        }
    }

    async writeInfoValue(hostname, key, value, topic) {
        const root = this.rootFor(hostname);
        const parts = key.split('.');
        const finalKey = parts[parts.length - 1];
        const mappedId = INFO_ID_MAP[key] || INFO_ID_MAP[finalKey] || ID_MAP[key] || ID_MAP[finalKey] || parts.map(part => part.replace(/[^a-zA-Z0-9_-]/g, '_')).join('.');
        const id = `${root}.Info.${mappedId}`;
        const name = INFO_LABELS[key] || INFO_LABELS[finalKey] || STATUS_LABELS[key] || STATUS_LABELS[finalKey] || topic || key;
        await this.writeValue(id, value, name, UNITS[key] || UNITS[finalKey]);
    }

    async writeValue(id, value, name, unit) {
        const type = typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string';
        let common = { name: name || id.split('.').pop(), type, role: type === 'boolean' ? 'indicator' : type === 'number' ? 'value' : 'text', read: true, write: false };
        if (unit) common.unit = unit;
        await this.setObjectNotExistsAsync(id, { type: 'state', common, native: {} });
        await this.extendObjectAsync(id, { common: { name: common.name, ...(unit ? { unit } : {}) } });
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
        if (key === 'power_on' && value) await this.publishCommand(hostname, 'on');
        else if (key === 'power_off' && value) await this.publishCommand(hostname, 'off');
        else if (key === 'request_status' && value) await this.publishCommand(hostname, 'status');
        else if (key === 'restart' && value) await this.publishCommand(hostname, 'restart');
        else if (key === 'request_settings' && value) await this.publish(`setting/${hostname}`, '');
        else if (key === 'control_json') {
            const parsed = this.parseJsonObject(value, key);
            if (parsed) await this.publishControl(hostname, parsed);
        } else if (key === 'setting_json') {
            const parsed = this.parseJsonObject(value, key);
            if (parsed) await this.publish(`setting/${hostname}`, JSON.stringify(parsed));
        } else if (key === 'command_topic') {
            if (value) this.log.debug(`Befehlsthema ${value} gespeichert; Nutzlast über command_payload senden.`);
        } else if (key === 'command_payload') {
            const command = await this.getStateAsync(`${this.rootFor(hostname)}.Commands.command_topic`);
            if (command && command.val) await this.publish(`command/${hostname}/${String(command.val).replace(/^command\//, '').replace(`${hostname}/`, '')}`, String(value ?? ''));
        } else if (key === 'setting_name') {
            this.log.debug('Einstellungsname bereit; nachfolgende Änderung an setting_value sendet den Wert.');
        } else if (key === 'setting_value') {
            const setting = await this.getStateAsync(`${this.rootFor(hostname)}.Commands.setting_name`);
            if (setting && setting.val) await this.publish(`setting/${hostname}/${setting.val}`, String(value ?? ''));
        }
        if (['power_on', 'power_off', 'request_status', 'restart', 'request_settings'].includes(key) && value) {
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
        const connectedHostnames = this.clients ? [...new Set([...this.clients.values()].filter(Boolean))] : [];
        if (this.clients) {
            this.clients.clear();
            this.updateConnectedClientsState();
        }
        const finish = async () => {
            try {
                await Promise.all(connectedHostnames.map(hostname => this.setModuleOnline(hostname, false)));
            } catch (error) {
                this.log.warn(`Erreichbarkeitsstatus beim Beenden konnte nicht zurückgesetzt werden: ${error.message || error}`);
            }
            if (this.broker) this.broker.close(() => callback());
            else callback();
        };
        if (this.server && this.server.listening) this.server.close(finish);
        else finish();
    }
}

if (module.parent) module.exports = options => new FaikinAdapter(options);
else new FaikinAdapter();
