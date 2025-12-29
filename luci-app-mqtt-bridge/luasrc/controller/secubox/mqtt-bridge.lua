local i18n = require "luci.i18n"
local _ = i18n.translate
module("luci.controller.secubox.mqtt-bridge", package.seeall)

function index()
	if not nixio.fs.access("/etc/config/mqtt-bridge") then
		return
	end

	local root = {"admin", "secubox", "network", "mqtt-bridge"}
	entry(root, firstchild(), _("MQTT Bridge"), 10).dependent = true
	entry(root + {"overview"}, view("mqtt-bridge/overview"), _("Overview"), 10).leaf = true
	entry(root + {"devices"}, view("mqtt-bridge/devices"), _("Devices"), 20).leaf = true
	entry(root + {"settings"}, view("mqtt-bridge/settings"), _("Settings"), 90).leaf = true
end
