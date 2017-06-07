package fr.marcworld.speakingscanner.service.impl;

import fr.marcworld.speakingscanner.enums.TextRecognitionLanguage;
import fr.marcworld.speakingscanner.service.TextRecognitionService;
import org.apache.tomcat.util.http.fileupload.IOUtils;
import org.bytedeco.javacpp.BytePointer;
import org.bytedeco.javacpp.lept;
import org.bytedeco.javacpp.tesseract;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.*;

/**
 * Default implementation of {@link TextRecognitionService}.
 *
 * @author Marc Plouhinec
 */
@Service
public class TextRecognitionServiceImpl implements TextRecognitionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(TextRecognitionServiceImpl.class);

    private String tessBaseAPIInitPath;

    @PostConstruct
    public void prepareTesseractTrainedData() throws IOException {
        // Create a temporary application directory
        File sampleFile = File.createTempFile("tesseractdata", "");
        File appDirectory = new File(sampleFile.getAbsolutePath() + "_dir");
        if (!appDirectory.mkdir()) {
            throw new IllegalStateException("Unable to create an application temporary directory.");
        }

        // Create a tessdata directory and copy the trained data there
        File tessdataDirectory = new File(appDirectory.getAbsolutePath() + "/tessdata");
        if (!tessdataDirectory.mkdir()) {
            throw new IllegalStateException("Unable to create a tessdata temporary directory.");
        }
        for (TextRecognitionLanguage language : TextRecognitionLanguage.values()) {
            String resourceName = language.getCode() + ".traineddata";
            Resource trainedDataResource = new ClassPathResource("tessdata/" + resourceName);
            File engFile = new File(tessdataDirectory, resourceName);
            try (InputStream inputStream = trainedDataResource.getInputStream();
                 OutputStream outputStream = new FileOutputStream(engFile)) {
                IOUtils.copyLarge(inputStream, outputStream);
            }
        }

        LOGGER.info("tessdata folder created at: " + tessdataDirectory.getAbsolutePath());

        tessBaseAPIInitPath = tessdataDirectory.getParentFile().getAbsolutePath();
    }

    @Override
    public String processFile(File file, TextRecognitionLanguage language) {
        tesseract.TessBaseAPI api = new tesseract.TessBaseAPI();
        BytePointer outText = null;
        lept.PIX image = null;

        try {
            if (api.Init(tessBaseAPIInitPath, language.getCode()) != 0) {
                LOGGER.error("Unable to initialize the Tesseract API with the path " + tessBaseAPIInitPath +
                        " and language code " + language.getCode() + ".");
                return null;
            }

            image = lept.pixRead(file.getAbsolutePath());
            api.SetImage(image);
            outText = api.GetUTF8Text();
            return String.valueOf(outText.getString());

        } finally {
            api.End();
            if (outText != null) {
                outText.deallocate();
            }
            if (image != null) {
                lept.pixDestroy(image);
            }
        }
    }
}
