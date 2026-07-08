import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image } from 'react-native';

const SPLASH_DURATION = 2500; // show for 2.5 seconds

export function SplashOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/splash-icon.png')}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
