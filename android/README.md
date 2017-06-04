# Speaking Scanner - Android version

## Introduction
The goal of this application is to allow visually impaired people to read paper documents by using
a portable scanner and their smartphone.

The application requires the following devices:
* A smartphone or tablet running 
[Android 4.1 Jelly Bean or greater](https://en.wikipedia.org/wiki/Android_version_history#Android_4.1_Jelly_Bean_.28API_16.29)
  with [USB OTG support](https://android.stackexchange.com/a/36888).
* A [USB OTG cable](http://www.usbtips.com/how-to-build-a-usb-otg-cable/).
* A portable scanner that appears as an USB storage device when plugged on a computer via USB (e.g. 
  [IRIScan Anywhere](http://www.irislink.com/EN-US/c1486/IRIScan-Anywhere-5---IRIScan-Anywhere-5-Wifi---Cordless-Scanner.aspx) or
  [Brother DSmobile 920DW](https://www.brother-usa.com/Scanners/ModelDetail/24/DS920DW/Overview)).
  
Speaking Scanner does not directly use Text-to-speech technology, but instead relies on
[Talkback](https://support.google.com/accessibility/android/answer/6283677), the native Android
accessibility feature for visually impaired people.

## Build and installation 
In order to download and build Speaking Scanner, please execute the following instructions:
* Setup [Git](https://git-scm.com/) on your computer.
* Download the sources with the following command: `git clone https://github.com/marcplouhinec/speaking-scanner`
* Download and setup [Android Studio](https://developer.android.com/studio/index.html).
* Open the folder containing this file.
* Follow the Android Studio instructions to install the required SDKs and tools.
* Plug your Android device to the computer with USB debugging enabled.
* Run the application by clicking on the *Run* toolbar button.

## Usage
Please follow theses instructions in order to use Speaking Scanner:
* Install Speaking Scanner on the Android device.
* Turn on the scanner and plug it to the Android device via the USB OTG cable.
* Launch the Speaking Scanner app.
* On Android versions greater than 
  [Lollipop (5.0)](https://en.wikipedia.org/wiki/Android_version_history#Android_5.0_Lollipop_.28API_21.29),
  the first screen allows you to select the USB storage (the scanner appears as a USB storage).
* Wait for the application to find all scanned documents.
* If you want, you can scan a new document and press the *Refresh* button.
* Select the scanned document you want to read and press the *Analyze* button.
* Wait for the application to analyze the document.
* Uses [Talkback](https://support.google.com/accessibility/android/answer/6283677) to read the
  recognized text that appears in the new screen.

## Technologies
Speaking Scanner is built with the following technologies:
* The [Kotlin language](https://kotlinlang.org/) with its 
  [Android extensions](https://kotlinlang.org/docs/tutorials/android-plugin.html).
* [Tesseract](https://github.com/tesseract-ocr/tesseract), an open source OCR engine, that converts
  images to text.
* [Tess Two](https://github.com/rmtheis/tess-two), an easy way to use Tesseract in Android projects.
* [Pdfium Android](https://github.com/barteksc/PdfiumAndroid), used for converting PDF files into bitmaps.
* [RxAndroid](https://github.com/ReactiveX/RxAndroid), used for easily handling background processes.
* [Anko](https://github.com/Kotlin/anko), a nice library that makes development faster when
  programming Android applications with Kotlin.

## Language support
Two languages are currently supported: English and French. The application automatically chooses the
language of the operating system.

Adding an additional language can be done in three steps:
1. Translate the file `app/src/main/res/values/strings.xml` 
   ([read the official documentation here](https://developer.android.com/studio/write/translations-editor.html)).
2. Copy the language-related trained data for Tesseract from 
   [this repository](https://github.com/tesseract-ocr/tessdata/tree/3.04.00) to the folder
   `app/src/main/assets/tessdata`.
3. Add the language in the file `app/src/main/java/fr/marcworld/speakingscanner/enums/TrainedDataLanguage.kt`.
