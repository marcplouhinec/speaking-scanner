package fr.marcworld.speakingscanner.broadcastreceivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.hardware.usb.UsbManager
import org.jetbrains.anko.AnkoLogger
import org.jetbrains.anko.info

/**
 * Listen to events when the USB scanner is plugged or unplugged.
 *
 * @author Marc Plouhinec
 */
class UsbBroadcastReceiver : BroadcastReceiver(), AnkoLogger {

    override fun onReceive(context: Context?, intent: Intent?) {
        when (intent?.action) {
            UsbManager.ACTION_USB_DEVICE_ATTACHED -> info("ACTION_USB_DEVICE_ATTACHED")
            UsbManager.ACTION_USB_DEVICE_DETACHED -> info("ACTION_USB_DEVICE_DETACHED")
        }
    }

}