import React from 'react';
import {StyleSheet} from 'react-native';
import {Camera, useCameraDevices} from 'react-native-vision-camera';

const App = () => {
  const devices = useCameraDevices('wide-angle-camera');
  const device = devices.back;

  return (
    <>
      {device ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
        />
      ) : null}
    </>
  );
};

export default App;
