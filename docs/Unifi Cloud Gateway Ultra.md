![](images/CGU.png)

###Unifi Cloud Gateway Ultra (CGU)

As an interim measure, I have upgraded my USG to the new Unifi Cloud Gateway Ultra

I still intend on upgrading again to a UDM Pro and a Unifi enterprise PoE switch of somekind when I either get a new house or extend the property where I am currently ( still not decided yet )

This thing is awesome.  I no longer have to run a seperate mongodb and Unifi network application.  This has the network controller firmware built in.

![](images/unifi_network_gui.png)

Installing this has allowed me to revamp my network.  I've changed the IPv4 subnet that I use across my network.

I used to use a 192.168.x.x subnet and this was as a result of a limitation with the USG.  Without the controller software built in, It was difficult to get the USG to change - I tried many times over SSH but it just didn't want to take.  Maybe I was doing something wrong?  With this new CGU however, I can do all of this using the network controller very easily.

I have now setup a /24 subnet using 10.36.100.0 subnet - The numbers here are relevant and make it memorable to me.

I also have plans for setting up multiple vLAN's but currently with the dumb switches I have, this isn't yet possible.


###Dynamic File

I do still need to specify a traefik dynamic file so that I can connect to the Network Controller firmware using my domain and SSL

This Dynamic File can be found [here](https://docs.xanderman.co.uk/dynamic/#unifi-cgu)
  

