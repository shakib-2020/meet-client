import {Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {useLiveMeetStore} from '../../service/meetStore';
import {inviteStyles} from '../../styles/inviteStyles';
import {addHyphens} from '../../utils/Helpers';
import {Clipboard, Share} from 'lucide-react-native';

const NoUserInvite = () => {
  const {sessionId} = useLiveMeetStore();
  return (
    <View style={inviteStyles.container}>
      <Text style={inviteStyles.headerText}>You're the only one here!</Text>
      <Text style={inviteStyles.subText}>
        Share this meeting link with others that you want in the meeting
      </Text>

      <View style={inviteStyles.linkContainer}>
        <Text style={inviteStyles.linkText}>
          meet.google.com/{addHyphens(sessionId)}
        </Text>
        <TouchableOpacity style={inviteStyles.iconButton}>
          <Clipboard color={'#fff'} size={20} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={inviteStyles.shareButton}>
        <Share color={'#000'} size={20} />
        <Text style={inviteStyles.shareText}>Share Invite</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NoUserInvite;
