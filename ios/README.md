# Speaking Scanner - iOS version

## Introduction
The goal of this application is to allow visually impaired people to read paper documents by using
a portable scanner and their smartphone.

This version of *Speaking Scanner* targets iOS devices. It is composed of the following parts:
* An iOS device, like an iPhone or an iPad.
* A portable scanner that provides a [WiFi access point](https://en.wikipedia.org/wiki/Wireless_access_point) in order
  to allow external computers to download scanned documents.
* A WiFi-to-BLE bridge, made with a [Single board computer](https://en.wikipedia.org/wiki/Single-board_computer),
  that downloads documents from the scanner via WiFi and provide them to the iOS device via 
  [BLE](https://en.wikipedia.org/wiki/Bluetooth_Low_Energy).
* A web-service that recognizes text in images.
  
## Architecture and technologies

### iOS device
Many visually impaired people uses iOS devices, because for many years their accessibility features were
superior compared to Android.

The mobile application was developed in order to be compatible with 
[VoiceOver](https://en.wikipedia.org/wiki/VoiceOver).

### WiFi-to-BLE bridge
Although iOS devices like iPhone or iPad support WiFi, this connection is often unavailable for communicating
with the portable scanner. The reason is that the portable scanner works as an 
[access point](https://en.wikipedia.org/wiki/Wireless_access_point) and iOS devices can only connect to
only one access point at a time. It means that an iOS device cannot have an internet connection
via WiFi and be connected to the scanner via WiFi at the same time.

Moreover, there are other limitations from Apple: there is no simple way to programmatically switch to
different registered WiFi networks on the iOS device, and the use of classic bluetooth or lightning connector
requires to join the [MFi licensing program](https://developer.apple.com/programs/mfi/), which is overkill.

This is the reason why BLE was chosen to connect an iOS device to the scanner via BLE and to internet via WiFi
at the same time.

### Text recognition web-service
[OCR technologies](https://en.wikipedia.org/wiki/Optical_character_recognition) allows *Speaking Scanner* to
"transform" a scanned document in an image format into some text that a screen reader can understand.

The [Tesseract](https://github.com/tesseract-ocr/tesseract) OCR engine has been chosen mainly because it is
open-source and easy to use programmatically.

Although Tesseract can [run directly on iOS devices](https://github.com/gali8/Tesseract-OCR-iOS), there are
several advantages in running it inside a web-server with a 
[REST interface](http://www.drdobbs.com/web-development/restful-web-services-a-tutorial/240169069):
* A server has more CPU power and memory than a mobile device, which leads to quicker results.
* [Language-related trained data](https://github.com/tesseract-ocr/tessdata/tree/3.04.00) is voluminous
  (greater than 1GB), which is less of a concern on a server.
* Advanced features can be easily added, like the ability to describe images or to summarize a document.

## Build and run
*Speaking Scanner* is currently a prototype and needs to be manually built and installed in order to be used.

Please follow theses instructions in order to run *Speaking Scanner*:
1. [Setup the WiFi-to-BLE bridge on a single board computer](wifiblebridge/README.md)
2. [Setup the text recognition web-service](web/README.md)
3. [Setup the iOS application](ios_app/README.md)

