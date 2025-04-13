import {Image, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {peopleStyles} from '../../styles/peopleStyles';
import {RTCView} from 'react-native-webrtc';
import {EllipsisVertical, MicOff} from 'lucide-react-native';
import {RFValue} from 'react-native-responsive-fontsize';

const People = ({people, containerDimensions}) => {
  const maxVisibleUsers = 8;
  const visiblePeople = people?.slice(0, maxVisibleUsers);
  const othersCount =
    people?.length > maxVisibleUsers ? people?.length - maxVisibleUsers : 0;

  const gridStyle = containerDimensions
    ? getGridStyles(
        visiblePeople?.length,
        containerDimensions.width,
        containerDimensions.height,
      )
    : {};

  const renderParticipant = (person, index) => {
    console.log('Rendering participant:', person.userId);
    console.log('Video enabled:', person.videoOn);
    console.log('Has stream:', person.streamURL);

    if (person?.videoOn && person?.streamURL) {
      console.log(
        'Stream tracks:',
        person.streamURL.getTracks().map(t => t.kind),
      );
      console.log('Stream URL:', person.streamURL.toURL());
    }

    return (
      <View
        key={person.userId}
        style={[
          peopleStyles.card,
          person?.speaking ? {borderWidth: 3} : null,
          Array.isArray(gridStyle) ? gridStyle[index] : gridStyle,
        ]}>
        {person?.videoOn && person?.streamURL ? (
          <RTCView
            mirror
            objectFit="cover"
            streamURL={person?.streamURL?.toURL()}
            style={[peopleStyles.rtcVideo, {backgroundColor: '#242424'}]}
            zOrder={1}
          />
        ) : (
          <View style={peopleStyles.noVideo}>
            {person?.photo ? (
              <Image source={{uri: person?.photo}} style={peopleStyles.image} />
            ) : (
              <Text style={peopleStyles.initial}>
                {person?.name?.charAt(0)}
              </Text>
            )}
          </View>
        )}

        <Text style={peopleStyles.name}>{person?.name}</Text>
        {!person?.micOn && (
          <View style={peopleStyles.muted}>
            <MicOff color={'#fff'} size={RFValue(10)} />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={peopleStyles.container}>
      {visiblePeople?.map((person, index) => renderParticipant(person, index))}
    </View>
  );
};

export default People;

const getGridStyles = (count, containerWidth, containerHeight) => {
  if (!containerWidth || !containerHeight) return {};

  switch (count) {
    case 1:
      return {width: '82%', height: '98%'};
    case 2:
      return {width: '82%', height: '48%'};
    case 3:
      return [
        {width: '82%', height: containerHeight * 0.5},
        {width: '40%', height: containerHeight * 0.46},
        {width: '40%', height: containerHeight * 0.46},
      ];
    case 4:
      return {width: '40%', height: containerHeight * 0.46};
    case 5:
    case 6:
      return {
        width: containerWidth / 2 - 40,
        height: containerHeight / 3 - 15,
      };
    default: {
      const maxCols = 2;
      const maxRows = 4;

      const itemWidth = containerWidth / maxCols - 40;
      const itemHeight = containerHeight / maxRows - 10;

      return {
        width: itemWidth,
        height: itemHeight,
      };
    }
  }
};
