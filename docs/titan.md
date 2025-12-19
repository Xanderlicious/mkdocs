Titan is my primary server and is where the majority of my media and services live.

![](images/titan-sysinfo.png)

**Specs**

- Intel i5 12600 CPU (alder lake)  
- Asus PRIME B660M-A D4 Motherboard  
- 64GB Corsair Vengance 3200mHz RAM (4x16GB)
- Nvidia QUADRO RTX 4000
- LSI Megaraid SAS 9260-8i RAID card
    - 6 X 8TB Seagate SAS drives 
    - Configured in a RAID6 array resulting in ~32TB of usable space
    - Mounted as /megaraid
- 1 X 2TB NVME WD BLACK SN770  
    - Used for the OS
- 1 X 256GB NVME Samsung 970 EVOPlus
    - Used for temp space for downloads
    - Mounted as /downloads
- 1 X 1TB Seagate SSD 
    - Used as space for compose files and container appdata  
    - Mounted as /ssd  
- 1 X 4TB Seagate Ironwolf drive
    - Used as space for small backup files and is main storage for music and pictures
    - Mounted as /ironwolf
- Corsair RM850x PSU
- Fractal Define R4 case

**Operating System**

![](images/debian.png)

Running Debian 13 (trixie)