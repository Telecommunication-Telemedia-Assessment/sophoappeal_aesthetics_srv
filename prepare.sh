#!/bin/bash
mkdir -p static/images
cd static/images
wget "https://avtshare01.rz.tu-ilmenau.de/sophoappeal/images_data.zip"
# extract
unzip images_data.zip
wget "https://raw.githubusercontent.com/Telecommunication-Telemedia-Assessment/sophoappeal_images/main/likes_views.json"


