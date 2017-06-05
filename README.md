# Speaking Scanner

The goal of this application is to allow visually impaired people to read paper documents by using
a portable scanner and their smartphone.

This application has been developed in two versions:
* [The first one with an iOS device, a portable scanner, a WiFi-to-BLE bridge and a web-service.](ios/README.md)
* [The second one with an Android device, a portable scanner and a USB OTG cable.](android/README.md)

The Android version is much simpler and faster than the iOS one. I started to develop with iOS
because it is the type of device most visually impaired people use around me (at the beginning,
iOS devices had better accessibility features than Android). However, because of few limitations
(no USB OTG cable, no simple way to switch between WiFi networks, ...etc), this solution was
quite slow, especially because of the time its requires to transfer data over 
[BLE](https://en.wikipedia.org/wiki/Bluetooth_Low_Energy).

Here is a demo video in English of the Android version:

[![Demo Video in English](https://img.youtube.com/vi/9WenZS-TH1s/0.jpg)](https://www.youtube.com/watch?v=9WenZS-TH1s)

Here is a demo video in French of the Android version:

[![Demo Video in French](https://img.youtube.com/vi/-C-QZzlr7BM/0.jpg)](https://www.youtube.com/watch?v=-C-QZzlr7BM)