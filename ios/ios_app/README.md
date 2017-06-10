# Speaking Scanner - iOS Application

## Introduction
The goal of this application is to allow visually impaired users to get documents from a portable scanner,
connect to the text recognition web-service and read out loud documents thanks to 
[VoiceOver](https://en.wikipedia.org/wiki/VoiceOver).

## Build and run
The first step is to configure the application by editing the `WS_URL` constant in the file
`SpeakingScanner/service/web/impl/RecognitionServiceImpl.swift`:

    fileprivate let WS_URL = "http://{hostname}:{port}/text_recognition/language/{language}"

* The `{hostname}` and `{port}` refer to the web-server where the *Text recognition web-service* is running .
* The `{language}` must contain the language of the scanned documents.
  For the moment, two values are supported: `ENGLISH` and `FRENCH`.

Here is a valid sample value for the `WS_URL` constant:

    fileprivate let WS_URL = "http://192.168.178.26:8080/text_recognition/language/FRENCH"

The next step is to build the application and execute it on an iOS device. For that you need to open
the `ios_app` folder in [Xcode](https://developer.apple.com/xcode/), plug your iOS device on your computer
and click on the "Run" button.
