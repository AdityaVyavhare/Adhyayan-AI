import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ToolHeaderProps {
    title: string;
    mode?: 'chat' | 'tool'; // 'chat' forces specific "New Chat" styling if needed
    onClose: () => void;
    onHistory: () => void;
    rightChildren?: React.ReactNode; // For additional tool-specific actions (e.g., PDF Toggle)
    headerStyle?: any; 
}

export default function ToolHeader({ 
    title, 
    mode = 'tool', 
    onClose, 
    onHistory,
    rightChildren 
}: ToolHeaderProps) {
    return (
        <View style={styles.header}>
            <View style={styles.leftContainer}>
                <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                    {/* User specified "Close" icon (X) for Chat Model. 
                        For tools, usually "Close" or "Back" depending on context. 
                        We'll use "close" default as per "exact same header layout" request for Chat Model, 
                        and implied consistency or standard close for others since they are "tools".
                    */}
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <View style={styles.centerContainer}>
                <Text style={styles.headerTitle}>{title}</Text>
            </View>

            <View style={styles.rightContainer}>
                {rightChildren}
                <TouchableOpacity onPress={onHistory} style={styles.historyButton}>
                    <Ionicons name="time-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 6,
        paddingTop: Platform.OS === 'android' ? 40 : 12, // Handle safe area/statusBar
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
        height: Platform.OS === 'android' ? 80 : 56,
        zIndex: 10,
    },
    leftContainer: {
        flex: 1,
        alignItems: 'flex-start',
    },
    centerContainer: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    iconButton: {
        padding: 4,
    },
    historyButton: {
        padding: 4,
        marginLeft: 4, 
    }
});
