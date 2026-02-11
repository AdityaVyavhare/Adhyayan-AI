import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ScanLandingViewProps {
  onCameraPress: () => void;
  onGalleryPress: () => void;
  onClose?: () => void;
}

export default function ScanLandingView({ onCameraPress, onGalleryPress, onClose }: ScanLandingViewProps) {
  return (
    <View style={styles.container}>
      {/* Header handled by Screen/ToolHeader usually, but if this is full screen modal: */}
      {/* We assume ToolHeader is present in the parent screen, so we just show content */}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Hero Section */}
        <View style={styles.heroContainer}>
            <View style={styles.heroImagePlaceholder}>
                 <Image 
                    source={require('../../assets/images/scan-hero.png')} 
                    style={{ width: '100%', height: '100%' }} 
                    resizeMode="contain" 
                 />
            </View>
            <Text style={styles.heroTitle}>Stuck on a problem?</Text>
            <Text style={styles.heroSubtitle}>
                Snap a photo or upload an image to get an instant step-by-step solution from AI.
            </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
            <TouchableOpacity style={[styles.actionButton, styles.cameraButton]} onPress={onCameraPress}>
                <Ionicons name="camera-outline" size={24} color="#fff" style={styles.btnIcon} />
                <Text style={styles.cameraButtonText}>Take a Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.galleryButton]} onPress={onGalleryPress}>
                <Ionicons name="image-outline" size={24} color="#4C51BF" style={styles.btnIcon} />
                <Text style={styles.galleryButtonText}>Upload from Gallery</Text>
            </TouchableOpacity>
        </View>

        {/* Tips Removed as per request */}


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
      padding: 24,
      paddingTop: 40,
      alignItems: 'center',
  },
  heroContainer: {
      alignItems: 'center',
      marginBottom: 40,
  },
  heroImagePlaceholder: {
      marginBottom: 24,
      width: 280, // Increased size for the illustration
      height: 280,
      justifyContent: 'center',
      alignItems: 'center',
  },
  heroTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: 12,
      textAlign: 'center',
  },
  heroSubtitle: {
      fontSize: 16,
      color: '#6b7280',
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 20,
  },
  actionsContainer: {
      width: '100%',
      gap: 16,
      marginBottom: 40,
  },
  actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1,
  },
  cameraButton: {
      backgroundColor: '#4C51BF',
      borderColor: '#4C51BF',
      shadowColor: '#4C51BF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
  },
  cameraButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
  },
  galleryButton: {
      backgroundColor: '#f0f9ff',
      borderColor: '#bae6fd',
  },
  galleryButtonText: {
      color: '#4C51BF',
      fontSize: 16,
      fontWeight: '600',
  },
  btnIcon: {
      marginRight: 10,
  },
  tipsCard: {
      width: '100%',
      backgroundColor: '#f9fafb',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: '#f3f4f6',
  },
  tipsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
  },
  tipsTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#374151',
      marginLeft: 8,
  },
  tipItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
  },
  tipText: {
      fontSize: 13,
      color: '#4b5563',
      marginLeft: 10,
      flex: 1,
      lineHeight: 20,
  },
});
