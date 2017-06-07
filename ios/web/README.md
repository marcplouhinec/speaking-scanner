# Speaking Scanner - Text recognition web service

## Introduction
The goal of this server is to provide a REST web service for recognizing text inside images.

This application is built on top of the following technologies:
* [Tesseract](https://github.com/tesseract-ocr/tesseract), an open source OCR engine, that converts
    images to text.
* [Spring Boot](https://projects.spring.io/spring-boot/)
* Java 8

## Build and run
In order to build and run this server you need to setup [Maven](https://maven.apache.org/) and
the [JDK 8](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html), then enter
the following commands:

    cd web
    mvn clean install
    mvn spring-boot:run
    
To make sure the server is working, open a web browser, visit the page 
[http://localhost:8080/](http://localhost:8080/) and check a welcome message is displayed.

The text recognition service can be easily tested with [curl](https://curl.haxx.se/):

    curl -v -H "Content-Type:image/jpeg" \
    -X POST --data-binary @path/to/image.jpg \
    http://localhost:8080/text_recognition/language/ENGLISH
    
Where `path/to/image.jpg` must be a path to an image file that contains some text. The result looks like this:

    {
        "recognizedText": "Sample recognized text."
        "errorCode": null
    }
    
In case of error, the result looks like this:

    {
        "recognizedText": null,
        "errorCode": "UNABLE_TO_UPLOAD_FILE"
    }
    
