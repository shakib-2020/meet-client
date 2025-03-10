import {Platform, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {useLiveMeetStore} from '../../service/meetStore';
import LinearGradient from 'react-native-linear-gradient';
import {Container, SwitchCamera, Volume2} from 'lucide-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {addHyphens} from '../../utils/Helpers';

const MeetHeader = ({switchCamera}) => {
  const {sessionId} = useLiveMeetStore();

  return (
    <LinearGradient
      colors={['#000', 'rgba(0, 0, 0, 0.7)', 'transparent']}
      style={styles.container}>
      <SafeAreaView />
      <View style={styles.header}>
        <Text style={styles.meetCode}>{addHyphens(sessionId)}</Text>
        <View style={styles.icons}>
          <SwitchCamera onPress={switchCamera} color={'white'} size={24} />
          <Volume2 color={'white'} size={24} style={styles.iconSpacing} />
        </View>
      </View>
    </LinearGradient>
  );
};

export default MeetHeader;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 30,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  meetCode: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 500,
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSpacing: {
    marginLeft: 20,
  },
});
