![](images/U6e.avif)

I have 2 unifi access points covering the house.

### Unifi U6 Enterprise

This provide a true WiFi 6 connection to the devices that support it as well as WiFi on the 2.4GHz and 5GHz bands

### Unifi AC-LR

This only supports 2.4GHz and 5GHz connections but allows seamless roaming with the U6E when moving around the house.


Both of these are suitably placed to provide excellent wifi coverage regardless of the device being used.

### Camera VLAN WiFi Network — "XanderC"

WiFi-only cameras (e.g. the [Tapo C121](motioneye.md)) have no PoE/Ethernet port, so they can't reach the isolated camera VLAN (102) the way the wired Reolink and Dahua cameras do. To let them attach directly to VLAN 102 over WiFi, I created a dedicated, hidden SSID — **XanderC** — broadcast from both the U6 Enterprise and AC-LR, tagged straight onto VLAN 102 rather than the main LAN. Any WiFi camera joining this network is isolated from the LAN and internet exactly like a wired VLAN 102 device, with no separate firewall rules needed.

