#!/bin/bash
mkdir -p static/images
cd static/images
wget "https://ftp.tu-ilmenau.de/hpc-private/ei/avt/sophoappeal/images_data.zip"
# extract
unzip images_data.zip
wget "https://raw.githubusercontent.com/Telecommunication-Telemedia-Assessment/sophoappeal_images/main/likes_views.json"


