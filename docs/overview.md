# Overview

To give you an idea of what my setup looks like, this page will explain at a high level what sort of network I have and the different pieces of hardware I'm running.

Other pages on this site will go into lots of detail of the different servers, their OS's, the applications i'm running and my networking setup.


## Internet & Network

![](images/virginmedia.png)

I have a Gigabit internet connection provided by Virgin Media here in the UK.  
With this, I am able to achieve over 1Gb down and 100Mb up.  
The superhub they provide has been placed into "modem only" (or bridged) mode which allows me to connect this to my Unifi Security Gateway router.  
From here I then have a multitude of switches and access points.


## Hardware & Devices

![](images/pihole.png)

I am currently running two raspberry pi's which act as my DNS resolvers and provide ad-blocking through a service called Pi-Hole.  They are sync'd with [gravity sync](https://github.com/vmstan/gravity-sync?tab=readme-ov-file).

The primary pi runs [PiVPN](https://www.pivpn.io/) which uses the "Wireguard" protocol and allows me to connect to my internal-only facing services from outside of my network

I have 2 main servers and an assortment of PC's, mobile phones, laptops and a gaming console.


## Applications

![](images/docker.png)

Docker.....  
Pretty much everything I host on my 2 main servers (including this site), runs in docker.  

All written and configured using docker compose.

##Future Plans

I do have some other, more powerful, hardware waiting to be deployed and I have plans to upgrade some of my existing networking gear.

For example, the USG I have is just about coping but I would very much like to change to a UDM Pro.  I also would like to upgrade to a 2.5Gb ethernet switch so my Unifi 6 Enterprise Access Point can perform to its fullest.

There are house improvements and/or a house move on the horizon which will allow for my expansion plans to go into overdrive.  

I plan on blogging the whole thing as and when it happens.

