import {StyleSheet, Text, View} from 'react-native';
import React, {useEffect} from 'react';
import {useContainerDimenstions} from '../hooks/useContainerDimensions';
import {useWebRTC} from '../hooks/useWebRTC';
import MeetHeader from '../components/meet/MeetHeader';
import UserView from '../components/meet/UserView';
import People from '../components/meet/People';
import NoUserInvite from '../components/meet/NoUserInvite';
import MeetFooter from '../components/meet/MeetFooter';
import {peopleData} from '../utils/dummyData';

const LiveMeetScreen = () => {
  const {containerDimensions, onContainerLayout} = useContainerDimenstions();
  const {localStream, participants, toggleMic, toggleVideo, switchCamera} =
    useWebRTC();

  useEffect(() => {
    console.log('localStream', localStream);
  }, [localStream]);

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

        {participants?.length > 0 ? (
          <People
            people={participants}
            containerDimensions={containerDimensions}
          />
        ) : (
          <NoUserInvite />
        )}
      </View>
      <MeetFooter toggleMic={toggleMic} toggleVideo={toggleVideo} />
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
