import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

export interface CodeBlockProps {
  code: string;
  language?: string;
}

/**
 * Renders syntax-highlighted code using highlight.js inside a WebView.
 * Replaces the broken react-native-syntax-highlighter which crashes on RN 0.81.
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'javascript' }) => {
  const webViewRef = useRef<WebView>(null);
  const [viewHeight, setViewHeight] = useState(80);
  const [isLoading, setIsLoading] = useState(true);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(code);
    } catch {
      // Fail silently; copying is a convenience.
    }
  };

  // Safely encode code content to avoid template literal injection issues
  const encodedCode = encodeURIComponent(code);
  const safeLang = encodeURIComponent(language);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/atom-one-dark.min.css" />
      <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { background-color: #0B1120; overflow: hidden; }
        pre {
          padding: 12px;
          margin: 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        code {
          font-family: 'Menlo', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.5;
          tab-size: 2;
        }
        .hljs { background: transparent !important; }
      </style>
    </head>
    <body>
      <pre><code id="codeblock"></code></pre>
      <script>
        (function() {
          var codeEl = document.getElementById("codeblock");
          var decoded = decodeURIComponent("${encodedCode}");
          codeEl.textContent = decoded;
          var lang = decodeURIComponent("${safeLang}");
          try {
            if (hljs.getLanguage(lang)) {
              codeEl.className = "language-" + lang;
            }
            hljs.highlightElement(codeEl);
          } catch(e) {}
          setTimeout(function() {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: "height", value: document.body.scrollHeight })
            );
          }, 100);
        })();
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{language.toUpperCase()}</Text>
        <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
          <Ionicons name="copy-outline" size={14} color="#E5E7EB" />
          <Text style={styles.copyText}>Copy</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: viewHeight }}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={[styles.webview, { height: viewHeight }]}
          scrollEnabled={false}
          onMessage={(event) => {
            try {
              const msg = JSON.parse(event.nativeEvent.data);
              if (msg.type === 'height' && typeof msg.value === 'number' && msg.value > 0) {
                setViewHeight(msg.value);
                setIsLoading(false);
              }
            } catch {
              setIsLoading(false);
            }
          }}
          showsVerticalScrollIndicator={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          androidLayerType="hardware"
          cacheEnabled={true}
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#6B7280" />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#020617',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  label: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(31,41,55,0.8)',
  },
  copyText: {
    color: '#E5E7EB',
    fontSize: 11,
    marginLeft: 4,
  },
  webview: {
    backgroundColor: '#0B1120',
    opacity: 0.99,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1120',
  },
});

export default CodeBlock;
