#!/bin/sh
# Asterisk configuration generator
# Generates PJSIP and dialplan configs from UCI

CONTAINER_PATH="/srv/lxc/voip"
AST_CONF="$CONTAINER_PATH/rootfs/etc/asterisk"

# Generate all Asterisk configs
generate_asterisk_config() {
    generate_pjsip_global
    generate_pjsip_trunk
    generate_pjsip_extensions
    generate_dialplan
    generate_voicemail_config
}

# Generate PJSIP global settings
generate_pjsip_global() {
    local sip_port=$(uci -q get voip.asterisk.sip_port || echo 5060)
    local rtp_start=$(uci -q get voip.asterisk.rtp_start || echo 10000)
    local rtp_end=$(uci -q get voip.asterisk.rtp_end || echo 20000)
    
    cat > "$AST_CONF/pjsip.conf" <<PJSIP
[global]
type=global
endpoint_identifier_order=ip,username
max_forwards=70
user_agent=SecuBox-VoIP/1.0

[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0:$sip_port

[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0:8089

PJSIP

    # Update RTP settings
    cat > "$AST_CONF/rtp.conf" <<RTP
[general]
rtpstart=$rtp_start
rtpend=$rtp_end
strictrtp=yes
icesupport=yes
stunaddr=stun.l.google.com:19302
RTP
}

# Generate PJSIP trunk configuration
generate_pjsip_trunk() {
    local enabled=$(uci -q get voip.sip_trunk.enabled)
    [ "$enabled" != "1" ] && return 0
    
    local provider=$(uci -q get voip.sip_trunk.provider)
    local host=$(uci -q get voip.sip_trunk.host)
    local username=$(uci -q get voip.sip_trunk.username)
    local password=$(uci -q get voip.sip_trunk.password)
    local codecs=$(uci -q get voip.sip_trunk.codecs || echo "ulaw,alaw")
    local dtmf=$(uci -q get voip.sip_trunk.dtmf_mode || echo "rfc4733")
    
    cat >> "$AST_CONF/pjsip.conf" <<TRUNK
; OVH SIP Trunk
[ovh-trunk-registration]
type=registration
outbound_auth=ovh-trunk-auth
server_uri=sip:$host
client_uri=sip:$username@$host
retry_interval=60
expiration=3600
contact_user=$username
line=yes
endpoint=ovh-trunk

[ovh-trunk-auth]
type=auth
auth_type=userpass
username=$username
password=$password
realm=$host

[ovh-trunk-aor]
type=aor
contact=sip:$host
qualify_frequency=60

[ovh-trunk]
type=endpoint
context=from-trunk
disallow=all
allow=$codecs
outbound_auth=ovh-trunk-auth
aors=ovh-trunk-aor
from_user=$username
from_domain=$host
direct_media=no
dtmf_mode=$dtmf
rtp_symmetric=yes
force_rport=yes
rewrite_contact=yes
ice_support=no
send_pai=yes
trust_id_outbound=yes

[ovh-trunk-identify]
type=identify
endpoint=ovh-trunk
match=$host
TRUNK
}

# Generate PJSIP extensions from UCI
generate_pjsip_extensions() {
    # Remove existing extension configs
    sed -i '/; Extensions/,$d' "$AST_CONF/pjsip.conf" 2>/dev/null || true
    
    cat >> "$AST_CONF/pjsip.conf" <<EXT

; Extensions
EXT

    # Read extensions from UCI
    uci show voip 2>/dev/null | grep "=extension" | while read -r line; do
        local section=$(echo "$line" | cut -d'.' -f2 | cut -d'=' -f1)
        local ext=$(echo "$section" | sed 's/ext_//')
        local name=$(uci -q get "voip.$section.name")
        local secret=$(uci -q get "voip.$section.secret")
        local context=$(uci -q get "voip.$section.context" || echo "internal")
        
        [ -z "$secret" ] && continue
        
        cat >> "$AST_CONF/pjsip.conf" <<ENDPOINT

[$ext]
type=endpoint
context=$context
disallow=all
allow=ulaw,alaw,opus,vp8
auth=$ext-auth
aors=$ext-aor
callerid="$name" <$ext>
direct_media=no
rtp_symmetric=yes
dtmf_mode=rfc4733
webrtc=yes
ice_support=yes

[$ext-auth]
type=auth
auth_type=userpass
username=$ext
password=$secret

[$ext-aor]
type=aor
max_contacts=5
remove_existing=yes
qualify_frequency=30
ENDPOINT
    done
}

# Generate dialplan
generate_dialplan() {
    local record_enabled=$(uci -q get voip.recording.enabled)
    local record_format=$(uci -q get voip.recording.format || echo "wav")
    local record_path="/srv/voip/recordings"

    # Recording macro - used by all contexts when recording is enabled
    local record_macro=""
    if [ "$record_enabled" = "1" ]; then
        record_macro="; Call Recording Macro
[macro-record]
exten => s,1,NoOp(Starting call recording)
 same => n,Set(RECORD_FILE=${record_path}/\${STRFTIME(\${EPOCH},,%Y%m%d)}/\${STRFTIME(\${EPOCH},,%H%M%S)}-\${CALLERID(num)}-\${ARG1}.${record_format})
 same => n,System(mkdir -p ${record_path}/\${STRFTIME(\${EPOCH},,%Y%m%d)})
 same => n,MixMonitor(\${RECORD_FILE},ab)
 same => n,MacroExit()

"
    fi

    cat > "$AST_CONF/extensions.conf" <<DIALPLAN
[general]
static=yes
writeprotect=no
clearglobalvars=no

[globals]
TRUNK=ovh-trunk
RECORD_ENABLED=${record_enabled:-0}
RECORD_PATH=${record_path}
RECORD_FORMAT=${record_format}

${record_macro}; Internal calls between extensions
[internal]
exten => _XXX,1,NoOp(Internal call to \${EXTEN})
 same => n,GotoIf(\$[\${RECORD_ENABLED}=1]?record:dial)
 same => n(record),Macro(record,\${EXTEN})
 same => n(dial),Dial(PJSIP/\${EXTEN},30)
 same => n,VoiceMail(\${EXTEN}@default,u)
 same => n,Hangup()

exten => _XXXX,1,NoOp(Internal call to \${EXTEN})
 same => n,GotoIf(\$[\${RECORD_ENABLED}=1]?record:dial)
 same => n(record),Macro(record,\${EXTEN})
 same => n(dial),Dial(PJSIP/\${EXTEN},30)
 same => n,VoiceMail(\${EXTEN}@default,u)
 same => n,Hangup()

; Voicemail access
exten => *98,1,NoOp(Voicemail access)
 same => n,VoiceMailMain(\${CALLERID(num)}@default)
 same => n,Hangup()

; Outbound calls via trunk
exten => _0XXXXXXXXX,1,NoOp(Outbound call to \${EXTEN})
 same => n,Set(CALLERID(num)=\${CALLERID(num)})
 same => n,GotoIf(\$[\${RECORD_ENABLED}=1]?record:dial)
 same => n(record),Macro(record,\${EXTEN})
 same => n(dial),Dial(PJSIP/\${EXTEN}@\${TRUNK},120)
 same => n,Hangup()

exten => _+XXXXXXXXXXX,1,NoOp(International call to \${EXTEN})
 same => n,GotoIf(\$[\${RECORD_ENABLED}=1]?record:dial)
 same => n(record),Macro(record,\${EXTEN})
 same => n(dial),Dial(PJSIP/\${EXTEN}@\${TRUNK},120)
 same => n,Hangup()

; Incoming calls from trunk
[from-trunk]
exten => _X.,1,NoOp(Incoming call from \${CALLERID(num)})
 same => n,Set(INCOMING_EXT=100)
 same => n,GotoIf(\$[\${RECORD_ENABLED}=1]?record:dial)
 same => n(record),Macro(record,\${INCOMING_EXT})
 same => n(dial),Dial(PJSIP/\${INCOMING_EXT},30)
 same => n,VoiceMail(\${INCOMING_EXT}@default,u)
 same => n,Hangup()

; IVR context (if enabled)
[ivr]
exten => s,1,NoOp(IVR Entry)
 same => n,Answer()
 same => n,Wait(1)
 same => n,Playback(welcome)
 same => n,Background(main-menu)
 same => n,WaitExten(10)

exten => 1,1,Goto(internal,100,1)
exten => 2,1,Goto(internal,101,1)
exten => 0,1,Goto(internal,100,1)

exten => i,1,Playback(invalid)
 same => n,Goto(s,1)

exten => t,1,Goto(internal,100,1)
DIALPLAN
}

# Generate voicemail configuration
generate_voicemail_config() {
    cat > "$AST_CONF/voicemail.conf" <<VOICEMAIL
[general]
format=wav49|gsm|wav
serveremail=asterisk@localhost
attach=yes
maxmsg=100
maxsecs=180
minsecs=3
maxsilence=10
silencethreshold=128
maxlogins=3
moveheard=yes
saycid=yes
sayduration=yes
saydurationm=2
sendvoicemail=yes
review=yes
tempgreetwarn=yes
messagewrap=yes
operator=yes
envelope=yes
delete=no
nextaftercmd=yes
forcename=no
forcegreetings=no
hidefromdir=no

[zonemessages]
eastern=America/New_York|'vm-received' Q 'digits/at' IMp
central=America/Chicago|'vm-received' Q 'digits/at' IMp
mountain=America/Denver|'vm-received' Q 'digits/at' IMp
pacific=America/Los_Angeles|'vm-received' Q 'digits/at' IMp
european=Europe/Paris|'vm-received' Q 'digits/at' IMp

[default]
VOICEMAIL

    # Add voicemail boxes for extensions
    uci show voip 2>/dev/null | grep "=extension" | while read -r line; do
        local section=$(echo "$line" | cut -d'.' -f2 | cut -d'=' -f1)
        local ext=$(echo "$section" | sed 's/ext_//')
        local name=$(uci -q get "voip.$section.name")
        local vm_enabled=$(uci -q get "voip.$section.voicemail")
        local vm_email=$(uci -q get "voip.$section.vm_email")
        
        [ "$vm_enabled" != "1" ] && continue
        
        local secret=$(uci -q get "voip.$section.secret" | head -c4)
        
        if [ -n "$vm_email" ]; then
            echo "$ext => $secret,$name,$vm_email,,attach=yes|delete=no" >> "$AST_CONF/voicemail.conf"
        else
            echo "$ext => $secret,$name,,,attach=no" >> "$AST_CONF/voicemail.conf"
        fi
    done
}
