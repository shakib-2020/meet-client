import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {useContainerDimenstions} from '../hooks/useContainerDimensions';
import {useWebRTC} from '../hooks/useWebRTC';
import MeetHeader from '../components/meet/MeetHeader';
import UserView from '../components/meet/UserView';

const LiveMeetScreen = () => {
  const {containerDimensions, onContainerLayout} = useContainerDimenstions();
  const {localStream, participants, toggleMic, toggleVideo, switchCamera} =
    useWebRTC();
  return (
    <View style={styles.container}>
      <MeetHeader switchCamera={() => {}} />
      <View style={styles.peopleContainer} onLayout={onContainerLayout}>
        {containerDimensions && localStream && (
          <UserView
            localStream={localStream}
            containerDimensions={containerDimensions}
          />
        )}
      </View>
    </View>
  );
};

export default LiveMeetScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  peopleContainer: {
    flex: 1,
  },
});
