import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {runOnJS} from 'react-native-reanimated';
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {scanOCR} from 'vision-camera-ocr';

const App = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [detectedText, setDetectedText] = React.useState<any>();
  const devices = useCameraDevices();
  const device = devices.back;

  useEffect(() => {
    getCameraPermissions();
  }, []);

  useEffect(() => {
    if (detectedText && detectedText.result.text) {
      console.log(detectedText.result.text);
    }
  }, [detectedText]);

  const getCameraPermissions = async () => {
    const status = await Camera.requestCameraPermission();
    setHasPermission(status === 'authorized');
  };

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';
    const scannedOcr = scanOCR(frame);

    runOnJS(setDetectedText)(scannedOcr);
  }, []);

  return device !== undefined && hasPermission ? (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
      frameProcessorFps={60}
      frameProcessor={frameProcessor}
    />
  ) : (
    <View>
      <Text>Waiting for camera...</Text>
    </View>
  );
};

export default App;
