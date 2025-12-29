'use strict';

function index()
	if not nixio.fs.access('/etc/config/zigbee2mqtt') then
		return
	end

	local root = node('admin', 'secubox')
	if not root then
		root = entry({'admin', 'secubox'}, firstchild(), _('SecuBox'), 10)
	end

	entry({'admin', 'secubox', 'zigbee2mqtt'}, firstchild(), _('Zigbee2MQTT'), 50).dependent = false
	entry({'admin', 'secubox', 'zigbee2mqtt', 'overview'}, view('zigbee2mqtt/overview'), _('Overview'), 10).leaf = true
end
