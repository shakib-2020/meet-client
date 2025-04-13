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
  const peerConnections = useRef(new Map());
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

  // const establishPeerConnections = async () => {
  //   participants?.forEach(async streamUser => {
  //     if (!peerConnections.current.has(streamUser?.userId)) {
  //       const peerConnection = new RTCPeerConnection(peerConstraints);
  //       peerConnections.current.set(streamUser?.userId, peerConnection);

  //       // Add tracks BEFORE creating offer
  //       if (localStream) {
  //         localStream.getTracks().forEach(track => {
  //           peerConnection.addTrack(track, localStream);
  //         });
  //       }

  //       peerConnection.onTrack = event => {
  //         const remoteStream = new MediaStream();
  //         event.streams[0].getTracks().forEach(track => {
  //           remoteStream.addTrack(track);
  //         });
  //         console.log('RECIVING REMOTE STREAM', remoteStream.toURL());
  //         setStreamURL(streamUser?.userId, remoteStream);
  //       };

  //       peerConnection.onicecandidate = ({candidate}) => {
  //         if (candidate) {
  //           emit('send-ice-candidate', {
  //             sessionId,
  //             sender: user?.id,
  //             receiver: streamUser?.userId,
  //             candidate,
  //           });
  //         }

  //         // localStream?.getTracks().forEach(track => {
  //         //   peerConnection.addTrack(track, localStream);
  //         // });

  //         (async () => {
  //           try {
  //             const offerDescription = await peerConnection.createOffer();
  //             await peerConnection.setLocalDescription(offerDescription);
  //             emit('send-offer', {
  //               sessionId,
  //               sender: user?.id,
  //               receiver: streamUser?.userId,
  //               offer: offerDescription,
  //             });
  //           } catch (error) {
  //             console.error('Error creating or sending offer:', error);
  //           }
  //         })();
  //       };
  //     }
  //   });
  // };

  const establishPeerConnections = async () => {
    participants?.forEach(async streamUser => {
      if (!peerConnections.current.has(streamUser?.userId)) {
        console.log('Creating new peer connection for:', streamUser?.userId);
        const peerConnection = new RTCPeerConnection(peerConstraints);
        peerConnections.current.set(streamUser?.userId, peerConnection);

        // Fix ontrack event handler
        peerConnection.ontrack = event => {
          console.log('Received track:', event.track.kind);
          console.log('Track settings:', event.track.getSettings());

          // Create a new MediaStream if it doesn't exist for this user
          let remoteStream = new MediaStream();

          // Add the track to the stream
          remoteStream.addTrack(event.track);

          console.log(
            'Remote stream tracks:',
            remoteStream.getTracks().map(t => t.kind),
          );
          console.log('Setting stream URL for user:', streamUser?.userId);

          // Update the participant's stream in the store
          setStreamURL(streamUser?.userId, remoteStream);
        };

        peerConnection.onicecandidate = ({candidate}) => {
          if (candidate) {
            console.log('Sending ICE candidate');
            emit('send-ice-candidate', {
              sessionId,
              sender: user?.id,
              receiver: streamUser?.userId,
              candidate,
            });
          }
        };

        peerConnection.oniceconnectionstatechange = () => {
          console.log(
            'ICE connection state:',
            peerConnection.iceConnectionState,
          );
        };

        // Add local tracks to the connection
        if (localStream) {
          console.log('Adding local tracks to connection');
          localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
          });
        }

        // Create and send offer
        try {
          console.log('Creating offer');
          const offerDescription = await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });

          console.log('Setting local description');
          await peerConnection.setLocalDescription(offerDescription);

          console.log('Sending offer');
          emit('send-offer', {
            sessionId,
            sender: user?.id,
            receiver: streamUser?.userId,
            offer: offerDescription,
          });
        } catch (error) {
          console.error('Error creating or sending offer:', error);
        }
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
        localStream?.getTracks()?.forEach(track => track.stop());
      };
    }
  }, []);

  // useEffect(() => {
  //   if (localStream) {
  //     on('receive-ice-candidate', handleReceiveIceCandidate);
  //     on('receive-offer', handleReceiveOffer);
  //     on('receive-answer', handleReceiveAnswer);
  //     on('new-participant', handleNewParticipant);
  //     on('participant-left', handleParticipantLeft);
  //     on('participant-update', handleParticipantUpdate);

  //     return () => {
  //       localStream?.getTracks().forEach(track => track.stop());
  //       peerConnections.current.forEach(pc => pc.close());
  //       peerConnections.current.clear();
  //       addSessionId(null);
  //       clear();
  //       emit('hang-up');
  //       off('receive-ice-candidate');
  //       off('receive-offer');
  //       off('receive-answer');
  //       off('new-participant');
  //       off('participant-left');
  //       off('participant-update');
  //     };
  //   }
  // }, [localStream]);

  useEffect(() => {
    if (localStream) {
      on('receive-ice-candidate', handleReceiveIceCandidate);
      on('receive-offer', handleReceiveOffer);
      on('receive-answer', handleReceiveAnswer);
      on('new-participant', handleNewParticipant);
      on('participant-left', handleParticipantLeft);
      on('participant-update', handleParticipantUpdate);

      return () => {
        // Cleanup streams
        localStream?.getTracks().forEach(track => {
          track.stop();
        });

        // Cleanup peer connections
        peerConnections.current.forEach((pc, userId) => {
          pc.getSenders().forEach(sender => {
            if (sender.track) {
              sender.track.stop();
            }
          });
          pc.getReceivers().forEach(receiver => {
            if (receiver.track) {
              receiver.track.stop();
            }
          });
          pc.close();
        });

        peerConnections.current.clear();
        addSessionId(null);
        clear();
        emit('hang-up');

        // Remove event listeners
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

  // const handleReceiveOffer = async ({sender, receiver, offer}) => {
  //   if (receiver !== user?.id) return;

  //   try {
  //     let peerConnection = peerConnections.current.get(sender);
  //     if (!peerConnection) {
  //       peerConnection = new RTCPeerConnection(peerConstraints);
  //       peerConnections.current.set(sender, peerConnection);

  //       peerConnection.onTrack = event => {
  //         const remoteStream = new MediaStream();
  //         event.streams[0].getTracks().forEach(track => {
  //           remoteStream.addTrack(track);
  //           console.log('RECEIVING REMOTE STREAM', remoteStream.toURL());
  //         });

  //         setStreamURL(sender, remoteStream);
  //       };

  //       peerConnection.onicecandidate = ({candidate}) => {
  //         if (candidate) {
  //           emit('send-ice-candidate', {
  //             sessionId,
  //             sender: receiver,
  //             receiver: sender,
  //             candidate,
  //           });
  //         }
  //       };

  //       if (pendingCandidates.current.has(sender)) {
  //         pendingCandidates.current.get(sender).forEach(candidate => {
  //           peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  //         });
  //         pendingCandidates.current.delete(sender);
  //       }

  //       if (localStream) {
  //         localStream.getTracks().forEach(track => {
  //           peerConnection.addTrack(track, localStream);
  //         });
  //       }
  //     }

  //     await peerConnection.setRemoteDescription(
  //       new RTCSessionDescription(offer),
  //     );

  //     const answer = await peerConnection.createAnswer();
  //     await peerConnection.setLocalDescription(answer);

  //     emit('send-answer', {
  //       sessionId,
  //       sender: receiver,
  //       receiver: sender,
  //       answer,
  //     });
  //   } catch (error) {
  //     console.error('Error handling offer:', error);
  //   }
  // };

  const handleReceiveOffer = async ({sender, receiver, offer}) => {
    if (receiver !== user?.id) return;
    console.log('Received offer from:', sender);

    try {
      let peerConnection = peerConnections.current.get(sender);
      if (!peerConnection) {
        console.log('Creating new peer connection for offer');
        peerConnection = new RTCPeerConnection(peerConstraints);
        peerConnections.current.set(sender, peerConnection);

        peerConnection.ontrack = event => {
          console.log('Received remote track in offer handler:', event);
          const remoteStream = new MediaStream();
          event.streams[0].getTracks().forEach(track => {
            console.log('Adding remote track to stream:', track.kind);
            remoteStream.addTrack(track);
          });
          console.log('Setting remote stream URL for:', sender);
          setStreamURL(sender, remoteStream);
        };

        peerConnection.oniceconnectionstatechange = () => {
          console.log(
            'ICE connection state (offer):',
            peerConnection.iceConnectionState,
          );
        };

        // Add local tracks before processing the offer
        if (localStream) {
          console.log('Adding local tracks to connection');
          localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
          });
        }
      }

      console.log('Setting remote description from offer');
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer),
      );

      console.log('Creating answer');
      const answer = await peerConnection.createAnswer();

      console.log('Setting local description');
      await peerConnection.setLocalDescription(answer);

      console.log('Sending answer');
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

    const peerConnection = peerConnections.current.get(sender);

    if (peerConnection) {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer),
      );
    }
  };

  const handleReceiveIceCandidate = async ({sender, receiver, candidate}) => {
    if (receiver !== user?.id) return;

    const peerConnection = peerConnections.current.get(sender);

    if (peerConnection) {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      if (!pendingCandidates.current.has(sender)) {
        pendingCandidates?.current.set(sender, []);
      }
      pendingCandidates.current.get(sender).push(candidate);
    }
  };

  const handleParticipantLeft = userId => {
    removeParticipant(userId);
    const pc = peerConnections.current.get(userId);

    if (pc) {
      pc.close();
      peerConnections.current.delete(userId);
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
