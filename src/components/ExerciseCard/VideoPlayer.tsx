/**
 * VideoPlayer Component
 *
 * A wrapper component for embedding YouTube videos using react-native-youtube-iframe.
 * Displays videos in a 16:9 aspect ratio container with controls.
 *
 * Dependencies:
 * - react-native-youtube-iframe: For YouTube video playback
 * - react-native-webview: Required peer dependency for YouTube iframe
 *
 * Note: Make sure to install both packages:
 * npm install react-native-youtube-iframe react-native-webview
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text, ActivityIndicator } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

// Get screen width for calculating video dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Calculate video height for 16:9 aspect ratio
// Subtract 32 for horizontal margins (16px on each side)
const VIDEO_WIDTH = SCREEN_WIDTH - 32;
const VIDEO_HEIGHT = VIDEO_WIDTH * (9 / 16);

// Props interface for VideoPlayer component
interface VideoPlayerProps {
  // YouTube video ID (the part after v= in YouTube URLs)
  // Example: For https://youtube.com/watch?v=dQw4w9WgXcQ, use "dQw4w9WgXcQ"
  videoId: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId }) => {
  // Track whether the video is currently playing
  const [isPlaying, setIsPlaying] = useState(false);
  // Track loading state for showing spinner
  const [isLoading, setIsLoading] = useState(true);
  // Track if there's an error loading the video
  const [hasError, setHasError] = useState(false);

  /**
   * Handles state changes from the YouTube player.
   * States include: 'playing', 'paused', 'ended', 'buffering', 'unstarted'
   */
  const handleStateChange = useCallback((state: string) => {
    if (state === 'playing') {
      setIsPlaying(true);
      setIsLoading(false);
    } else if (state === 'paused' || state === 'ended') {
      setIsPlaying(false);
    } else if (state === 'buffering') {
      setIsLoading(true);
    }
  }, []);

  /**
   * Handles errors from the YouTube player.
   * Common errors include invalid video ID or network issues.
   */
  const handleError = useCallback((error: string) => {
    console.error('YouTube Player Error:', error);
    setHasError(true);
    setIsLoading(false);
  }, []);

  /**
   * Called when the player is ready to play.
   * Hides the loading indicator.
   */
  const handleReady = useCallback(() => {
    setIsLoading(false);
  }, []);

  // If no video ID is provided, show placeholder
  if (!videoId) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No video available</Text>
        </View>
      </View>
    );
  }

  // If there's an error, show error message
  if (hasError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Failed to load video</Text>
          <Text style={styles.errorSubtext}>Check your connection or video ID</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Loading spinner overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      )}

      {/* YouTube video player */}
      <YoutubePlayer
        height={VIDEO_HEIGHT}
        width={VIDEO_WIDTH}
        videoId={videoId}
        play={isPlaying}
        onChangeState={handleStateChange}
        onError={handleError}
        onReady={handleReady}
        // Enable controls for better user experience
        webViewProps={{
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Container maintaining 16:9 aspect ratio
  container: {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    alignSelf: 'center',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  // Placeholder when no video ID is provided
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
  },
  placeholderText: {
    color: '#888888',
    fontSize: 14,
  },
  // Loading spinner overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1,
  },
  // Error state container
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorSubtext: {
    color: '#888888',
    fontSize: 12,
  },
});

export default VideoPlayer;
