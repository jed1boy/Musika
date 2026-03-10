package com.musika.app.ui.activities

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Send
import androidx.compose.material.icons.rounded.BugReport
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.musika.app.api.CrashReportService
import com.musika.app.ui.theme.MusikaTheme
import kotlinx.coroutines.launch
import kotlin.system.exitProcess

class CrashActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val stackTrace = intent.getStringExtra("stack_trace") ?: "No stack trace available."
        val threadName = intent.getStringExtra("thread_name")
        val crashTimeMs = intent.getLongExtra("crash_time_ms", -1L).takeIf { it > 0L }

        setContent {
            MusikaTheme {
                CrashScreen(
                    stackTrace = stackTrace,
                    threadName = threadName,
                    crashTimeMs = crashTimeMs,
                )
            }
        }
    }
}

@Composable
fun CrashScreen(
    stackTrace: String,
    threadName: String?,
    crashTimeMs: Long?,
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()
    val coroutineScope = rememberCoroutineScope()
    var isSending by remember { mutableStateOf(false) }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(
                    imageVector = Icons.Rounded.BugReport, 
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(8.dp)
                )
                Text(
                    text = "App Crashed",
                    style = MaterialTheme.typography.headlineMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.error
                    )
                )
            }

            Text(
                text = "The app encountered an unexpected error. You can upload the crash log below for diagnostics.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onBackground
            )

            Surface(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Text(
                    text = stackTrace,
                    modifier = Modifier
                        .padding(12.dp)
                        .verticalScroll(scrollState),
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp
                    ),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = {
                        if (isSending) return@Button
                        isSending = true
                        coroutineScope.launch {
                            val result = CrashReportService.sendCrashReport(
                                context = context,
                                stackTrace = stackTrace,
                                threadName = threadName,
                                crashTimeMs = crashTimeMs,
                            )
                            isSending = false
                            result.fold(
                                onSuccess = {
                                    Toast.makeText(
                                        context,
                                        "Crash log uploaded successfully.",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                },
                                onFailure = {
                                    Toast.makeText(
                                        context,
                                        "Failed to upload crash log. Check your internet connection and try again.",
                                        Toast.LENGTH_LONG
                                    ).show()
                                }
                            )
                        }
                    },
                    enabled = !isSending,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer,
                        contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                ) {
                    if (isSending) {
                        Box(contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(
                                strokeWidth = 2.dp,
                                modifier = Modifier.height(18.dp)
                            )
                        }
                        Spacer(Modifier.width(8.dp))
                        Text("Sending...")
                    } else {
                        Icon(Icons.AutoMirrored.Rounded.Send, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Send Logs")
                    }
                }

                Button(
                    onClick = {
                         exitProcess(0)
                    },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer,
                        contentColor = MaterialTheme.colorScheme.onErrorContainer
                    )
                ) {
                    Text("Close App")
                }
            }
        }
    }
}
