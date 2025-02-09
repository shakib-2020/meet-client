import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';

export const useLiveMeetStore = create()(
  (set, get) => ({
    sessionId: null,
    participants: [],
    // chatMessages: [],
    micOn: false,
    videoOn: false,
    addSessionId: id => {
      set({sessionId: id});
    },
    addParticipant: participant => {
      const {participants} = get();
      if (!participants.find(p => p.userId === participant?.userId)) {
        set({participants: [...participants, participant]});
      }
    },
    removeParticipant: participantId => {
      const {participants} = get();
      set({
        participants: participants.filter(p => p.userId !== participantId),
      });
    },
    updateParticipant: updatedParticipant => {
      const {participants} = get();
      set({
        participants: participants.map(p =>
          p.userId === updatedParticipant.userId
            ? {
                ...p,
                micOn: updatedParticipant.micOn,
                videoOn: updatedParticipant.videoOn,
              }
            : p,
        ),
      });
    },
    setStreamURL: (participantId, streamURL) => {
      const {participants} = get();
      const updatedParticipants = participants.map(p => {
        if (p.userId === participantId) {
          return {...p, streamURL};
        }
        return p;
      });

      // if (!participants.some(p => p.userId === participantId)) {
      //   updatedParticipants.push({id: participantId, streamURL});
      // }

      set({participants: updatedParticipants});
    },

    toggle: type => {
      if (type === 'mic') {
        set(state => ({maicOn: !state.micOn}));
      } else {
        set(state => ({videoOn: !state.videoOn}));
      }
    },
  }),
  {
    name: 'live-meet-storage',
    storage: createJSONStorage(() => mmkvStorage),
  },
);
