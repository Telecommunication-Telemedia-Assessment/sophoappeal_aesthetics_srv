# Sophoappeal Aesthetics View evaluation web service
A web service for rating aesthetics of photos.

This repository is part of [Sohpappeal](https://github.com/Telecommunication-Telemedia-Assessment/sophoappeal).
Please use the main repository as starting point.

This repository is part of the DFG project [Sophoappeal (437543412)](https://www.tu-ilmenau.de/universitaet/fakultaeten/fakultaet-elektrotechnik-und-informationstechnik/profil/institute-und-fachgebiete/fachgebiet-audiovisuelle-technik/forschung/dfg-projekt-sophoappeal), it contains images and analysis scripts.

This tool is used to collect appeal ratings in all tests (lab and crowd).


## Requirements
* nodejs,
* npm,
* forever

For Ubuntu 20.04 run the following commands:
```bash
sudo apt install nodejs npm
sudo npm install forever -g
```

Afterwards run
```bash
npm install
```
to install all required packages.

Furthermore, get the images that are required for the app, using the
`./prepare.sh` script, for this it is required to have wget and unzip.

## Development Database
To run the sever for development purposes, you need to have a mongo database running locally (localhost with default ports and no password).

## Configuration
The `const config = {` part in `app.js` can be used to configure different views and other parts.


## Start the server
To start the server in development mode run (a mongo db running is required): 
```bash
npm start
```

and then open http://localhost:9999/

## Deployment
For deployment use `docker-compose up` to setup the service.
Port 9994 will be used.



## Acknowledgments

If you use this software or data in your research, please include a link to the repository and reference the following paper.

```bibtex
@article{goering2023imageappeal,
  title={Image Appeal Revisited: Analysis, new Dataset and Prediction Models},
  author={Steve G\"oring and Alexander Raake},
  journal={IEEE Access},
  year={2023},
  publisher={IEEE},
  note={to appear}
}
```

## License
GNU General Public License v3. See [LICENSE.md](./LICENSE.md) file in this repository.