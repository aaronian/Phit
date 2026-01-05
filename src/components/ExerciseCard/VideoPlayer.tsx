/**
 * VideoPlayer Component - Collapsible
 *
 * Shows a compact "Watch Demo" button by default.
 * Expands to show YouTube video when tapped.
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_WIDTH = SCREEN_WIDTH - 140; // Account for side panel
const VIDEO_HEIGHT = VIDEO_WIDTH * (9 / 16);

interface VideoPlayerProps {
  videoId: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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

  const handleError = useCallback((error: string) => {
    console.error('YouTube Player Error:', error);
    setHasError(true);
    setIsLoading(false);
  }, []);

  const handleReady = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleCollapse = () => {
    setIsExpanded(false);
    setIsPlaying(false);
  };

  if (!videoId) {
    return null; // Don't show anything if no video
  }

  // Collapsed state - show compact button
  if (!isExpanded) {
    return (
      <TouchableOpacity style={styles.collapsedButton} onPress={() => setIsExpanded(true)}>
        <Text style={styles.playIcon}>▶</Text>
        <Text style={styles.collapsedText}>Watch Demo</Text>
      </TouchableOpacity>
    );
  }

  // Expanded state - show video
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.collapseButton} onPress={handleCollapse}>
        <Text style={styles.collapseText}>Hide Video ▲</Text>
      </TouchableOpacity>

      {hasError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load video</Text>
        </View>
      ) : (
        <View style={styles.videoWrapper}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#0A84FF" />
            </View>
          )}
          <YoutubePlayer
            height={VIDEO_HEIGHT}
            width={VIDEO_WIDTH}
            videoId={videoId}
            play={isPlaying}
            onChangeState={handleStateChange}
            onError={handleError}
            onReady={handleReady}
            webViewProps={{
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  collapsedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2E',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  playIcon: {
    fontSize: 12,
    color: '#0A84FF',
  },
  collapsedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0A84FF',
  },
  container: {
    marginBottom: 12,
  },
  collapseButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  collapseText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  videoWrapper: {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    alignSelf: 'center',
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1,
  },
  errorContainer: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 14,
  },
});

export default VideoPlayer;
