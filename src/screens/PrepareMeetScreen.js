import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useWS} from '../service/api/WSProvider';
import {useLiveMeetStore} from '../service/meetStore';
import {useUserStore} from '../service/userStore';
import {RTCView, mediaDevices} from 'react-native-webrtc';
import {prepareStyles} from '../styles/prepareStyles';
import {addHyphens, requestPermissions} from '../utils/Helpers';
import {goBack, replace} from '../utils/NavigationUtils';
import {ChevronLeft, EllipsisVertical} from 'lucide-react-native';
import {RFValue} from 'react-native-responsive-fontsize';
import {Colors} from '../utils/Constants';
const PrepareMeetScreen = () => {
  const {emit, on, off} = useWS();
  const {addParticipant, sessionId, addSessionId, toggle, micOn, videoOn} =
    useLiveMeetStore();
  const {user} = useUserStore();

  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const handleParticipantUpdate = updatedParticipants => {
      setParticipants(updatedParticipants);
    };
    on('session-info', handleParticipantUpdate);
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream?.release();
      }

      setLocalStream(null);
      off('session-info', handleParticipantUpdate);
    };
  }, [sessionId, emit, on, off]);

  const showMediaDevices = (audio, video) => {
    mediaDevices
      ?.getDisplayMedia({
        audio,
        video,
      })
      .then(stream => {
        setLocalStream(stream);
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];

        if (audioTrack) {
          audioTrack.enabled = audio;
        }

        if (videoTrack) {
          videoTrack.enabled = audio;
        }
      })
      .catch(err => {
        console.log('Error getting media devices', err);
      });
  };

  const toggleMicState = newState => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];

      if (audioTrack) {
        audioTrack.enabled = newState;
      }
    }
  };

  const toggleVideoState = newState => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];

      if (audioTrack) {
        videoTrack.enabled = newState;
      }
    }
  };

  const toggleLocal = type => {
    if (type === 'mic') {
      const newMicState = !micOn;
      toggleMicState(newMicState);
      toggle('mic');
    }

    if (type === 'video') {
      const newVideoState = !videoOn;
      toggleVideoState(newVideoState);
      toggle('video');
    }
  };

  const fatchMediaPermission = async () => {
    const result = await requestPermissions();
    if (result.isCameraGranted) {
      toggleLocal('video');
    }
    if (result.isMicrophoneGranted) {
      toggleLocal('mic');
    }

    showMediaDevices(result.isMicrophoneGranted, result.isCameraGranted);
  };

  useEffect(() => {
    fatchMediaPermission();
    console.log('inside', sessionId);
  }, []);

  const handleStartCall = async () => {
    try {
      emit('join-session', {
        name: user?.name,
        photo: user?.photo,
        userId: user?.id,
        sessionId: sessionId,
        micOn,
        videoOn,
      });
      participants.forEach(i => addParticipant(i));
      addSessionId(sessionId);
      replace('LiveMeetScreen');
    } catch (error) {
      console.log('Error starting call', error);
    }
  };

  const renderParticipantText = () => {
    if (participants?.length === 0) {
      return 'No one is in the call yer';
    }

    const name = participants
      ?.slice(0, 2)
      ?.map(p => p.name)
      ?.join(', ');
    const count =
      participants.length > 2 ? `and ${participants.length - 2} others` : '';
    return `${name}${count} in the call`;
  };

  return (
    <View style={prepareStyles.container}>
      <SafeAreaView />
      <View style={prepareStyles.headerContainer}>
        <ChevronLeft
          size={RFValue(22)}
          onPress={() => {
            goBack();
            addSessionId(null);
          }}
          color={Colors.text}
        />
        <EllipsisVertical size={RFValue(18)} color={Colors.text} />
      </View>
      <ScrollView contentContainerStyle={{flex: 1}}>
        <View style={prepareStyles.videoContainer}>
          <Text style={prepareStyles.meetingCode}>{addHyphens(sessionId)}</Text>
          <View style={prepareStyles.camera}>
            {localStream && videoOn ? (
              <RTCView
                streamURL={localStream?.toURL()}
                style={prepareStyles?.localVideo}
                mirror={true}
                objectFit="cover"
              />
            ) : (
              <Image source={{uri: user?.photo}} style={prepareStyles?.image} />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default PrepareMeetScreen;

const styles = StyleSheet.create({});
