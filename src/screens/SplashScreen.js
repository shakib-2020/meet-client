import {Image, StyleSheet, Text, View} from 'react-native';
import React, {useEffect} from 'react';
import {screenHeight, screenWidth} from '../utils/Constants';
import {resetAndNavigate} from '../utils/NavigationUtils';
import {useNavigation} from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();
  useEffect(() => {
    const timerId = setTimeout(() => {
      // navigation.navigate('HomeScreen');
      resetAndNavigate('HomeScreen');
      console.log('again');
    }, 1200);

    console.log('hi');

    return () => clearTimeout(timerId);
  }, []);

  return (
    <View style={styles.container}>
      <Image style={styles.image} source={require('../assets/images/g.png')} />
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth * 0.7,
    height: screenHeight * 0.7,
    resizeMode: 'contain',
  },
});
