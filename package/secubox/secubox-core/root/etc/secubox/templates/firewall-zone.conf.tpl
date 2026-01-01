# SecuBox Firewall Zone Template
# Variables: {{ZONE_NAME}}, {{INPUT}}, {{OUTPUT}}, {{FORWARD}}, {{MASQ}}

config zone
	option name '{{ZONE_NAME}}'
	option input '{{INPUT}}'
	option output '{{OUTPUT}}'
	option forward '{{FORWARD}}'
	{{#MASQ}}
	option masq '1'
	{{/MASQ}}
	list network '{{ZONE_NAME}}'

config forwarding
	option src '{{ZONE_NAME}}'
	option dest 'wan'
