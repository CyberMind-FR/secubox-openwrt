for obj in secubox system-hub network-modes vhost-manager cdn-cache; do
    scp luci-app-$obj/root/usr/libexec/rpcd/luci.$obj root@192.168.8.191:/usr/libexec/rpcd/ || exit 1
    ssh root@192.168.8.191 "chmod 755 /usr/libexec/rpcd/luci.$obj" || exit 1
done
ssh root@192.168.8.191 "/etc/init.d/rpcd restart && /etc/init.d/uhttpd restart"
