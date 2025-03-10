/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useRef} from 'react';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import {useWS} from '../service/api/WSProvider';
import {useLiveMeetStore} from '../service/meetStore';
import {useUserStore} from '../service/userStore';
import {peerConstraints} from '../utils/Helpers';

export const useWebRTC = () => {
  const {
    participants,
    sessionId,
    micOn,
    videoOn,
    addSessionId,
    addParticipant,
    removeParticipant,
    updateParticipant,
    setStreamURL,
    toggle,
    clear,
  } = useLiveMeetStore();

  const {user} = useUserStore();
  const [localStream, setLocalStream] = useState(null);
  const {emit, on, off} = useWS();
  const peerConnnections = useRef(new Map());
  const pendingCandidates = useRef(new Map());

  const startLocalStream = async () => {
    try {
      const mediaStream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setLocalStream(mediaStream);
    } catch (error) {
      console.log('Error starting local stream:', error);
    }
  };

  const establishPeerConnections = async () => {
    participants?.forEach(async streamUser => {
      if (!peerConnnections.current.has(streamUser?.userId)) {
        const peerConnnection = new RTCPeerConnection(peerConstraints);
        peerConnnections.current.set(streamUser?.userId, peerConnnection);

        peerConnnection.onTrack = event => {
          const remoteStream = new MediaStream();
          event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track);
          });
          console.log('RECIVING REMOTE STREAM', remoteStream.toURL());
          setStreamURL(streamUser?.userId, remoteStream);
        };

        peerConnnection.onicecandidate = ({candidate}) => {
          if (candidate) {
            emit('send-ice-candidate', {
              sessionId,
              sender: user?.id,
              receiver: streamUser?.userId,
              candidate,
            });
          }

          localStream?.getTracks().forEach(track => {
            peerConnnection.addTrack(track, localStream);
          });

          (async () => {
            try {
              const offerDescription = await peerConnnection.createOffer();
              await peerConnnection.setLocalDescription(offerDescription);
              emit('send-offer', {
                sessionId,
                sender: user?.id,
                receiver: streamUser?.userId,
                offer: offerDescription,
              });
            } catch (error) {
              console.error('Error creating or sending offer:', error);
            }
          })();
        };
      }
    });
  };

  const joiningStream = async () => {
    await establishPeerConnections();
  };

  useEffect(() => {
    if (localStream) {
      joiningStream();
    }
  }, [localStream]);

  useEffect(() => {
    startLocalStream();
    if (localStream) {
      return () => {
        localStream?.getTracks?.forEach(track => track.stop());
      };
    }
  }, []);

  useEffect(() => {
    if (localStream) {
      on('receive-ice-candidate', handleReceiveIceCandidate);
      on('receive-offer', handleReceiveOffer);
      on('receive-answer', handleReceiveAnswer);
      on('new-participant', handleNewParticipant);
      on('participant-left', handleParticipantLeft);
      on('participant-update', handleParticipantUpdate);

      return () => {
        localStream?.getTracks().forEach(track => track.stop());
        peerConnnections.current.forEach(pc => pc.close());
        peerConnnections.current.clear();
        addSessionId(null);
        clear();
        emit('hang-up');
        off('receive-ice-candidate');
        off('receive-offer');
        off('receive-answer');
        off('new-participant');
        off('participant-left');
        off('participant-update');
      };
    }
  }, [localStream]);

  const handleNewParticipant = participant => {
    if (participant?.userId === user?.id) return;
    addParticipant(participant);
  };

  const handleReceiveOffer = async ({sender, receiver, offer}) => {
    if (receiver !== user?.id) return;

    try {
      let peerConnnection = peerConnnections.current.get(sender);
      if (!peerConnnection) {
        peerConnnection = new RTCPeerConnection(peerConstraints);
        peerConnnection.current.set(sender, peerConnnection);

        peerConnnection.onTrack = event => {
          const remoteStream = new MediaStream();
          event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track);
            console.log('RECEIVING REMOTE STREAM', remoteStream.toURL());
          });

          setStreamURL(sender, remoteStream);
        };

        peerConnnection.onicecandidate = ({candidate}) => {
          if (candidate) {
            emit('send-ice-candidate', {
              sessionId,
              sender: receiver,
              receiver: sender,
              candidate,
            });
          }
        };

        if (pendingCandidates.current.has(sender)) {
          pendingCandidates.current.get(sender).forEach(candidate => {
            peerConnnection.addIceCandidate(new RTCIceCandidate(candidate));
          });
          pendingCandidates.current.delete(sender);
        }

        if (localStream) {
          localStream.getTracks().forEach(track => {
            peerConnnection.addTrack(track, localStream);
          });
        }
      }

      await peerConnnection.setRemoteDescription(
        new RTCSessionDescription(offer),
      );

      const answer = await peerConnnection.createAnswer();
      await peerConnnection.setLocalDescription(answer);

      emit('send-answer', {
        sessionId,
        sender: receiver,
        receiver: sender,
        answer,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleReceiveAnswer = async ({sender, receiver, answer}) => {
    if (receiver !== user?.id) return;

    const peerConnnection = peerConnnections.current.get(sender);

    if (peerConnnection) {
      await peerConnnection.setRemoteDescription(
        new RTCSessionDescription(answer),
      );
    }
  };

  const handleReceiveIceCandidate = async ({sender, receiver, candidate}) => {
    if (receiver !== user?.id) return;

    const peerConnnection = peerConnnections.current.get(sender);

    if (peerConnnection) {
      peerConnnection.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      if (!pendingCandidates.current.has(sender)) {
        pendingCandidates?.current.set(sender, []);
      }
      pendingCandidates.current.get(sender).push(candidate);
    }
  };

  const handleParticipantLeft = userId => {
    removeParticipant(userId);
    const pc = peerConnnections.current.get(userId);

    if (pc) {
      pc.close();
      peerConnnections.current.delete(userId);
    }
  };

  const handleParticipantUpdate = updatedParticipant => {
    updateParticipant(updatedParticipant);
  };

  const toggleMic = () => {
    if (localStream) {
      localStream?.getAudioTracks().forEach(track => {
        micOn ? (track.enabled = false) : (track.enabled = true);
      });
    }

    toggle('mic');
    emit('toggle-mute', {sessionId, userId: user?.id});
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream?.getVideoTracks().forEach(track => {
        videoOn ? (track.enabled = false) : (track.enabled = true);
      });
    }

    toggle('video');
    emit('toggle-video', {sessionId, userId: user?.id});
  };

  const switchCamera = () => {
    if (localStream) {
      localStream?.getVideoTracks().forEach(track => {
        track._switchCamera();
      });
    }
  };

  return {
    localStream,
    participants,
    toggleMic,
    toggleVideo,
    switchCamera,
  };
};
