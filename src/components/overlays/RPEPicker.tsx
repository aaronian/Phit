/**
 * RPEPicker.tsx - Scroll Wheel for RPE Selection
 *
 * WHAT IS RPE?
 * RPE (Rate of Perceived Exertion) is a scale used in strength training
 * to measure how hard a set felt. The common scale runs from 6 to 10:
 * - 6: Very light effort (could do many more reps)
 * - 7: Light effort (3-4 reps left in tank)
 * - 8: Moderate effort (2-3 reps left)
 * - 9: Hard effort (1 rep left)
 * - 10: Maximum effort (couldn't do another rep)
 *
 * WHAT THIS COMPONENT DOES:
 * This bottom sheet presents a scrollable picker (like iOS date picker)
 * for selecting RPE values from 6.0 to 10.0 in 0.5 increments.
 * The large centered display shows the current selection clearly.
 *
 * PICKER PATTERN:
 * Scroll pickers are great for:
 * - Limited option sets (like our 9 RPE values)
 * - When you want to prevent typos (no keyboard input)
 * - Creating a tactile, natural selection experience
 */

import React, { useCallback, useState, useMemo, useRef, forwardRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

// Get screen dimensions for responsive sizing
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Height of each item in the scroll list
const ITEM_HEIGHT = 60;

// Number of items visible in the picker at once (odd number centers selection)
const VISIBLE_ITEMS = 5;

/**
 * RPE_VALUES - All possible RPE values
 *
 * We define these as an array of objects for easier rendering.
 * Each object has a numeric value and a string label for display.
 */
const RPE_VALUES = [
  { value: 6.0, label: '6.0' },
  { value: 6.5, label: '6.5' },
  { value: 7.0, label: '7.0' },
  { value: 7.5, label: '7.5' },
  { value: 8.0, label: '8.0' },
  { value: 8.5, label: '8.5' },
  { value: 9.0, label: '9.0' },
  { value: 9.5, label: '9.5' },
  { value: 10.0, label: '10.0' },
];

/**
 * Props Interface
 */
interface RPEPickerProps {
  initialValue?: number | null;
  onConfirm: (value: number) => void;
  onDismiss?: () => void;
}

/**
 * RPEPicker Component
 */
const RPEPicker = forwardRef<BottomSheet, RPEPickerProps>(
  ({ initialValue, onConfirm, onDismiss }, ref) => {
    // Find the initial index based on the provided value
    // Default to 8.0 (middle of the common training range) if no value provided
    const initialIndex = useMemo(() => {
      if (initialValue === null || initialValue === undefined) {
        return 4; // Index of 8.0
      }
      const index = RPE_VALUES.findIndex((item) => item.value === initialValue);
      return index >= 0 ? index : 4;
    }, [initialValue]);

    // Track the currently selected value
    const [selectedIndex, setSelectedIndex] = useState(initialIndex);

    // Reference to the FlatList for programmatic scrolling
    const flatListRef = useRef<FlatList>(null);

    // Sheet snap points
    const snapPoints = useMemo(() => ['45%'], []);

    /**
     * Handle Scroll End
     *
     * When the user stops scrolling, we "snap" to the nearest item.
     * This creates the picker-wheel effect where items click into place.
     */
    const handleScrollEnd = useCallback(
      (event: { nativeEvent: { contentOffset: { y: number } } }) => {
        // Calculate which item is closest to center
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        // Clamp to valid range
        const clampedIndex = Math.max(
          0,
          Math.min(index, RPE_VALUES.length - 1)
        );
        setSelectedIndex(clampedIndex);
      },
      []
    );

    /**
     * Handle Item Press
     *
     * Allow users to tap an item to select it directly.
     */
    const handleItemPress = useCallback(
      (index: number) => {
        setSelectedIndex(index);
        // Scroll to center the selected item
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5, // Center the item
        });
      },
      []
    );

    /**
     * Handle Done Button
     */
    const handleDone = useCallback(() => {
      onConfirm(RPE_VALUES[selectedIndex].value);
    }, [selectedIndex, onConfirm]);

    /**
     * Handle Sheet Changes
     */
    const handleSheetChange = useCallback(
      (index: number) => {
        if (index === -1) {
          onDismiss?.();
        }
      },
      [onDismiss]
    );

    /**
     * Render Backdrop
     */
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      []
    );

    /**
     * Render Picker Item
     *
     * Each item in the scroll list. The selected item is highlighted.
     */
    const renderItem = useCallback(
      ({ item, index }: { item: { value: number; label: string }; index: number }) => {
        const isSelected = index === selectedIndex;
        return (
          <TouchableOpacity
            style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
            onPress={() => handleItemPress(index)}
            accessibilityLabel={`RPE ${item.label}`}
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.pickerItemText,
                isSelected && styles.pickerItemTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      },
      [selectedIndex, handleItemPress]
    );

    /**
     * Get Item Layout
     *
     * FlatList optimization: tells React Native the exact dimensions
     * of each item so it doesn't have to measure them.
     */
    const getItemLayout = useCallback(
      (_: any, index: number) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      }),
      []
    );

    /**
     * Calculate content padding
     *
     * We add padding so the first and last items can be centered.
     * Without this, you couldn't scroll them to the center.
     */
    const contentContainerPadding = (VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Rate of Perceived Exertion</Text>
          </View>

          {/* Large Display of Selected Value */}
          <View style={styles.selectedDisplay}>
            <Text style={styles.selectedValue}>
              {RPE_VALUES[selectedIndex].label}
            </Text>
            <Text style={styles.selectedLabel}>RPE</Text>
          </View>

          {/* Scroll Picker */}
          <View style={styles.pickerContainer}>
            {/* Selection indicator overlay */}
            <View style={styles.selectionIndicator} pointerEvents="none" />

            <FlatList
              ref={flatListRef}
              data={RPE_VALUES}
              renderItem={renderItem}
              keyExtractor={(item) => item.label}
              showsVerticalScrollIndicator={false}
              // Snap to items when scrolling stops
              snapToInterval={ITEM_HEIGHT}
              snapToAlignment="center"
              decelerationRate="fast"
              // Handle scroll events
              onMomentumScrollEnd={handleScrollEnd}
              // Optimization props
              getItemLayout={getItemLayout}
              initialScrollIndex={initialIndex}
              // Add padding so first/last items can center
              contentContainerStyle={{
                paddingTop: contentContainerPadding,
                paddingBottom: contentContainerPadding,
              }}
            />
          </View>

          {/* Done Button */}
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
            accessibilityLabel="Confirm RPE selection"
            accessibilityRole="button"
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

/**
 * Styles
 */
const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: '#5C5C5E',
    width: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Large display showing current selection
  selectedDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedValue: {
    fontSize: 64,
    fontWeight: '200',
    color: '#0A84FF',
    fontVariant: ['tabular-nums'],
  },
  selectedLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: -8,
  },
  // Picker scroll area
  pickerContainer: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    marginBottom: 16,
    position: 'relative',
  },
  // Highlight for the selected item row
  selectionIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT * ((VISIBLE_ITEMS - 1) / 2),
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    zIndex: -1,
  },
  // Individual picker item
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemSelected: {
    // Selected styling handled by text
  },
  pickerItemText: {
    fontSize: 24,
    fontWeight: '400',
    color: '#8E8E93',
    fontVariant: ['tabular-nums'],
  },
  pickerItemTextSelected: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // Done button
  doneButton: {
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

RPEPicker.displayName = 'RPEPicker';

export default RPEPicker;
