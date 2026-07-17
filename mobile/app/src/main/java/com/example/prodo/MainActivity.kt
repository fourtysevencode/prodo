package com.example.prodo

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Bundle
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : ComponentActivity() {

    private val CAMERA_PERMISSION_REQUEST = 101
    private var webView: WebView? = null
    private var pendingPermissionRequest: PermissionRequest? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            
            webViewClient = object : WebViewClient() {
                @Deprecated("Deprecated in Java")
                override fun shouldOverrideUrlLoading(view: WebView?, url: String): Boolean {
                    return false
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest) {
                    val cameraPermission = Manifest.permission.CAMERA
                    if (ContextCompat.checkSelfPermission(this@MainActivity, cameraPermission) == PackageManager.PERMISSION_GRANTED) {
                        request.grant(request.resources)
                    } else {
                        pendingPermissionRequest = request
                        ActivityCompat.requestPermissions(
                            this@MainActivity,
                            arrayOf(cameraPermission),
                            CAMERA_PERMISSION_REQUEST
                        )
                    }
                }
            }
        }

        setContentView(webView!!)
        webView?.loadUrl("https://prodo-live.pages.dev")
    }

    @Deprecated("Deprecated in Java")
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == CAMERA_PERMISSION_REQUEST) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                pendingPermissionRequest?.let {
                    it.grant(it.resources)
                }
            } else {
                pendingPermissionRequest?.deny()
            }
            pendingPermissionRequest = null
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView?.canGoBack() == true) {
            webView?.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
