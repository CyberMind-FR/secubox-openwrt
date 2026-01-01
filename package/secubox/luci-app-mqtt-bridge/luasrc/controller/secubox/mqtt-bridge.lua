local i18n = require "luci.i18n"
local _ = i18n.translate
module("luci.controller.secubox.mqtt-bridge", package.seeall)

function index()
	if not nixio.fs.access("/etc/config/mqtt-bridge") then
		return
	end

	entry({"admin", "secubox", "network", "mqtt-bridge"}, firstchild(), _("MQTT Bridge"), 10).dependent = true
	entry({"admin", "secubox", "network", "mqtt-bridge", "overview"}, view("mqtt-bridge/overview"), _("Overview"), 10).leaf = true
	entry({"admin", "secubox", "network", "mqtt-bridge", "devices"}, view("mqtt-bridge/devices"), _("Devices"), 20).leaf = true
	entry({"admin", "secubox", "network", "mqtt-bridge", "settings"}, view("mqtt-bridge/settings"), _("Settings"), 90).leaf = true
end
