import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PublicForumReal() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Under Construction</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E20000',
  },
}); 