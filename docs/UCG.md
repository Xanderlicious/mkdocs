

As an interim measure, I have upgraded my USG to the newly launched Unifi Cloud Gateway Ultra.

This provides a 2.5Gb WAN port and 4 1Gb LAN ports (one of these LAN ports can be configured to be a secondary WAN)

This provides a good couple of improvements over the USG.

The main advantage for myself here is that I no longer have to self-host the unifi controller in docker.  This is now done on the CGU itself.

###Dynamic File

I still have a dynamic file setup to allow access to the controller software routed through Traefik and with SSL.

That Dynamic file can be located [here](https://docs.xanderman.co.uk/dynamic/#unifi-cuthbert)

Once installed, I was then able to navigate to the DNS name I have specified.