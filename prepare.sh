#!/bin/bash
mkdir -p static/images
cd static/images
wget "https://resdata.tu-ilmenau.de/public/ei/avt/sophoappeal/images_data.zip"
# extract
unzip images_data.zip
wget "https://raw.githubusercontent.com/Telecommunication-Telemedia-Assessment/sophoappeal_images/main/likes_views.json"


