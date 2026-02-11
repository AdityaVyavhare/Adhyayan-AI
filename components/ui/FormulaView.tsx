import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface FormulaViewProps {
    formula: string;
    style?: any;
}

/**
 * Renders LaTeX math using KaTeX inside a WebView.
 * Used by TypewriterEffect for live-streaming formula rendering.
 * Auto-resizes to fit the rendered formula height.
 */
const FormulaView: React.FC<FormulaViewProps> = ({ formula, style }) => {
    const webViewRef = useRef<WebView>(null);
    const [viewHeight, setViewHeight] = useState(48);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Safely encode the formula so it passes through the JS template literal
    // without any backslash corruption. Decode inside the WebView.
    const encodedFormula = encodeURIComponent(formula);

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
                  integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
                  crossorigin="anonymous" />
            <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"
                    integrity="sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vniwctzAF4t3OB"
                    crossorigin="anonymous"></script>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body {
                    background-color: transparent;
                    overflow: hidden;
                }
                body {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8px 4px;
                    min-height: 32px;
                }
                .katex-display {
                    margin: 0 !important;
                }
                .katex {
                    font-size: 1.15em;
                    color: #1F2937;
                }
                .katex-error {
                    font-family: monospace;
                    font-size: 13px;
                    color: #6B7280;
                    white-space: pre-wrap;
                    word-break: break-word;
                }
            </style>
        </head>
        <body>
            <div id="formula"></div>
            <script>
                document.addEventListener("DOMContentLoaded", function() {
                    try {
                        var tex = decodeURIComponent("${encodedFormula}");
                        katex.render(tex, document.getElementById("formula"), {
                            throwOnError: false,
                            displayMode: true,
                            strict: false,
                            trust: true
                        });
                    } catch (e) {
                        document.getElementById("formula").className = "katex-error";
                        document.getElementById("formula").textContent = decodeURIComponent("${encodedFormula}");
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "error" }));
                    }
                    setTimeout(function() {
                        var h = document.body.scrollHeight;
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "height", value: h }));
                    }, 80);
                });
            </script>
        </body>
        </html>
    `;

    if (hasError) {
        return (
            <View style={styles.fallbackContainer}>
                <Text style={styles.fallbackText}>{formula}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, style, { height: viewHeight }]}>
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
                            setViewHeight(msg.value + 4);
                            setIsLoading(false);
                        } else if (msg.type === 'error') {
                            setHasError(true);
                        }
                    } catch {
                        const h = Number(event.nativeEvent.data);
                        if (!isNaN(h) && h > 0) {
                            setViewHeight(h + 4);
                        }
                        setIsLoading(false);
                    }
                }}
                onError={() => setHasError(true)}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                androidLayerType="hardware"
                cacheEnabled={true}
            />
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color="#9CA3AF" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 8,
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    webview: {
        backgroundColor: 'transparent',
        opacity: 0.99, // Fix Android WebView flicker
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    fallbackContainer: {
        width: '100%',
        marginVertical: 8,
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    fallbackText: {
        fontFamily: 'monospace',
        fontSize: 14,
        color: '#4B5563',
        textAlign: 'center',
    },
});

export default FormulaView;
