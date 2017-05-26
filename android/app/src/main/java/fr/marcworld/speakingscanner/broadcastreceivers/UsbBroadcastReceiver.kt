package fr.marcworld.speakingscanner.broadcastreceivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.hardware.usb.UsbManager
import fr.marcworld.speakingscanner.androidservices.UsbFileScannerService
import org.jetbrains.anko.startService

/**
 * Listen to events when the USB scanner is plugged or unplugged.
 *
 * @author Marc Plouhinec
 */
class UsbBroadcastReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context?, intent: Intent?) {
        when (intent?.action) {
            UsbManager.ACTION_USB_DEVICE_ATTACHED -> context?.startService<UsbFileScannerService>()
            UsbManager.ACTION_USB_DEVICE_DETACHED -> context?.stopService(Intent(context, UsbFileScannerService::class.java))
        }
    }

}