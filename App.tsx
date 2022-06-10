import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, ToastAndroid, View} from 'react-native';
import {runOnJS} from 'react-native-reanimated';
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {scanOCR} from 'vision-camera-ocr';

const SPECIAL_SEQUENCE = '99';

const App = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [detectedText, setDetectedText] = useState<any>();
  const devices = useCameraDevices();
  const device = devices.back;

  const readingMessage = useRef(false);
  const sequenceRead = useRef<string[]>([]);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const status = await Camera.requestCameraPermission();
    setHasPermission(status === 'authorized');
  };

  useEffect(() => {
    if (isDetectedTextValid()) {
      processDetectedText();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedText]);

  const isDetectedTextValid = (): boolean => {
    return detectedText && detectedText.result.text.length >= 2;
  };

  const processDetectedText = () => {
    let fpsValue = extractFpsValue();
    if (!fpsValue) {
      return;
    }
    fpsValue = fixFpsValue(fpsValue);
    decodeMessage(fpsValue);
  };

  const extractFpsValue = (): number | undefined => {
    const matches: string[] = detectedText.result.text.match(/\d+/g);
    if (!matches) {
      return;
    }

    const possibleFpsValues: number[] = matches
      .filter(match => {
        return Number(match) > 10 && Number(match) < 65;
      })
      .map(strNumber => {
        return Number(strNumber);
      });

    if (possibleFpsValues.length === 0) {
      return;
    }

    return Math.max(...possibleFpsValues);
  };

  const fixFpsValue = (fpsValue: number): number => {
    const numbers = fpsValue.toString().split('');
    if (numbers.length < 2) {
      return fpsValue;
    }

    switch (numbers[1]) {
      case '7': {
        numbers[1] = '1';
      }
    }

    return Number(numbers.join(''));
  };

  const decodeMessage = (fpsValue: number) => {
    const bitDetected = fpsValue.toString().split('')[1];

    if (!readingMessage.current) {
      sequenceRead.current.push(bitDetected);
      if (sequenceRead.current.length === 2) {
        if (sequenceRead.current.join('') !== SPECIAL_SEQUENCE) {
          sequenceRead.current.reverse().pop();
          return;
        }
        ToastAndroid.show(
          'Start sequence detected, decoding...',
          ToastAndroid.SHORT,
        );
        readingMessage.current = true;
        sequenceRead.current = [];
      }
      return;
    }

    sequenceRead.current.push(bitDetected);
    if (sequenceRead.current.join('').slice(-2) === SPECIAL_SEQUENCE) {
      const asciiString = fromBinary(sequenceRead.current.join('').split('9'));
      ToastAndroid.show(`Message received: ${asciiString}`, ToastAndroid.LONG);
      readingMessage.current = false;
      sequenceRead.current = [];
    }
  };

  const fromBinary = (binaryCharacters: string[]): string => {
    const asciiCharacters: string[] = [];

    binaryCharacters.forEach(binaryChar => {
      asciiCharacters.push(String.fromCharCode(parseInt(binaryChar, 2)));
    });

    return asciiCharacters.join('');
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
      frameProcessorFps={1}
      frameProcessor={frameProcessor}
    />
  ) : (
    <View>
      <Text>Waiting for camera...</Text>
    </View>
  );
};

export default App;
