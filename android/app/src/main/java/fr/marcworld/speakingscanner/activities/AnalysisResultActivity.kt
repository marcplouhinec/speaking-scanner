package fr.marcworld.speakingscanner.activities

import android.os.Bundle
import android.support.v7.app.AppCompatActivity
import fr.marcworld.speakingscanner.R
import kotlinx.android.synthetic.main.activity_analysis_result.*

/**
 * Display the result of an image analysis.
 *
 * @author Marc Plouhinec
 */
class AnalysisResultActivity : AppCompatActivity() {

    companion object {
        val RECOGNIZED_TEXT_INTENT_NAME = "recognizedText"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_analysis_result)
        setTitle(R.string.analysis_result)

        val recognizedText = intent.getStringExtra(RECOGNIZED_TEXT_INTENT_NAME)
        recognizedTextView.text = recognizedText
    }
}
