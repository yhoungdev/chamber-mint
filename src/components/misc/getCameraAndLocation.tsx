import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRef, useState, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    })();
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const captureImage = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setImageUri(photo.uri);
    }
  };

  const mintNFT = async () => {
    if (imageUri && location) {
    
      console.log('Minting NFT with image:', imageUri, 'and location:', location.coords);
    } else {
      console.log('Capture an image and allow location access before minting.');
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} type={facing} />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
          <Text style={styles.text}>Flip Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={captureImage}>
          <Text style={styles.text}>Capture Image</Text>
        </TouchableOpacity>

        {imageUri && (
          <TouchableOpacity style={styles.button} onPress={mintNFT}>
            <Text style={styles.text}>Mint NFT</Text>
          </TouchableOpacity>
        )}
      </View>

      {imageUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
    paddingBottom: 20,
  },
  button: {
    backgroundColor: '#1e90ff',
    padding: 10,
    borderRadius: 5,
  },
  text: {
    fontSize: 16,
    color: 'white',
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    width: 300,
    height: 300,
    marginTop: 10,
  },
});
