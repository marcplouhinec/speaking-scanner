package fr.marcworld.speakingscanner.androidservices

import android.app.Service
import android.content.Intent
import android.os.IBinder
import org.jetbrains.anko.AnkoLogger
import org.jetbrains.anko.info

/**
 * Observe USB scanner files.
 *
 * @author Marc Plouhinec
 */
class UsbFileScannerService : Service(), AnkoLogger {

    override fun onCreate() {
        super.onCreate()

        info("Start UsbFileScannerService.")
    }

    override fun onDestroy() {
        super.onDestroy()

        info("Stop UsbFileScannerService.")
    }

    override fun onBind(intent: Intent): IBinder? {
        throw UnsupportedOperationException("Not yet implemented")
    }
}
