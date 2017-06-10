# Speaking Scanner - WiFi-BLE bridge

## Introduction
This application is the main part of a bridge that allows an iOS device to communicate with a portable scanner.
It is meant to run on a single board computer like a [Raspberry PI](https://www.raspberrypi.org/) with WiFi and
[BLE](https://en.wikipedia.org/wiki/Bluetooth_Low_Energy) capabilities (the 
[Raspberry PI 3 Model B](https://www.raspberrypi.org/products/raspberry-pi-3-model-b/) should fit; in my
tests I used the Raspberry PI 2 with WiFi and BLE USB dongles).

The portable scanner must have WiFi capabilities and must serve scanned document files via FTP (e.g.
[Brother DSmobile 920DW](https://www.brother-usa.com/Scanners/ModelDetail/24/DS920DW/Overview)).

This application performs the following actions:
* Connect via FTP over WiFi to the portable scanner in order to download scanned documents.
* Convert PDF files into JPEG (documents that are already in the JPEG format are simply copied).
* Compress documents by reducing their size and converting them to gray-level.
* Generate thumbnails.
* Send documents to an iOS device over BLE.

This bridge uses the following technologies:
* [Bleno](https://github.com/sandeepmistry/bleno), a library that transforms a computer into a
  BLE (Bluetooth Low Energy) peripheral. This library is so simple to use that it is the main reason why
  I chose a NodeJS stack!
* [NodeJS](https://nodejs.org/) version 6.11.0 or greater.
* [ECMAScript 6](https://en.wikipedia.org/wiki/ECMAScript#6th_Edition_-_ECMAScript_2015)
* [CRC](https://github.com/alexgorbatchev/node-crc), a library for calculating Cyclic Redundancy Check (CRC),
  used to transfer bulk of data reliably over BLE.
* [Jsftp](https://github.com/sergi/jsftp), a client FTP library for NodeJS.
* [Pdf2img](https://github.com/fitraditya/node-pdf2img), a library for converting pdf into image file.
* [Imagemagick](https://github.com/rsms/node-imagemagick), the famous tool for transforming images.
* [Lodash](https://lodash.com/), an awesome library especially useful when working with collections.
* [Log4js](https://github.com/nomiddlename/log4js-node), a logging framework for JavaScript.

## Build and run
The first step is to setup a single board computer (or a development one) with WiFi and BLE peripheral devices.
The OS must be Linux or Mac OSX and the following software must be setup:
* Install [NodeJS LTS version](https://nodejs.org).
* Install the [Bleno prerequisites](https://github.com/sandeepmistry/bleno).
* Install the [Imagemagick CLI tool](http://www.imagemagick.org/). For instance, if you're on OS X you
  can use [Homebrew](https://brew.sh/): `brew install imagemagick`.
* Install [GraphicsMagick](http://www.graphicsmagick.org/).

The next step is to configure the computer to connect via WiFi to the portable scanner, get its IP address
and test the FTP connection with a FTP client like [Filezilla](https://filezilla-project.org/).
Alternatively, for development only, you can run a local FTP server on your computer. Here is a 
[tutorial for Mac OSX](https://cartwrightlab.wikispaces.com/Setting+up+an+FTP+server+on+a+Mac).

The next step is to configure *WiFi-BLE bridge* by editing the `configuration.js` file:
* Fill the `scannerFtp*` properties with the ones you used to configure your FTP connection.
* Create on your computer all the folders corresponding to the `*path` properties and make sure the user
  that will run the NodeJS app has read and write access to them.
* You can leave the `*PeriodMs` properties to their default values.

Finally, you can run the application with the following commands:

    cd wifiblebridge
    npm install
    node app
    
