import { Camera, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRef, useState, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import {
  Connection, Keypair, LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createMint, mintTo, getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import * as FileSystem from 'expo-file-system';

const SUPABASE_URL = 'https://qbnlktmaijeqrjxegcbi.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const cameraRef = useRef<Camera | null>(null);

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

  const uploadToSupabase = async () => {
    if (imageUri) {
      try {
        setIsUploading(true);

        const fileUri = imageUri;
        const fileName = `image_${Date.now()}.jpeg`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        const { data, error } = await supabase.storage
          .from('nft-chamber')
          .upload(fileName, {
            uri: fileUri,
            type: 'image/jpeg',
            name: fileName,
          });

        setIsUploading(false);

        if (error) {
          console.error('Error uploading to Supabase:', error);
          return null;
        }

        const { publicURL } = supabase.storage
          .from('nft-chamber')
          .getPublicUrl(fileName);

        console.log('Uploaded to Supabase:', publicURL);
        return publicURL;
      } catch (error) {
        setIsUploading(false);
        console.log('Error uploading to Supabase:', error);
        return null;
      }
    }
  };

  const mintNFT = async () => {
    if (imageUri && location) {
      setIsMinting(true);
      const imageUrl = await uploadToSupabase();

      if (imageUrl) {
        console.log('Minting NFT with Supabase image URL:', imageUrl);
        await mintNFTOnSolana(imageUrl);
      } else {
        console.log('Error: Image upload to Supabase failed.');
      }

      setIsMinting(false);
    } else {
      console.log('Capture an image and allow location access before minting.');
    }
  };

  const mintNFTOnSolana = async (imageUrl: string) => {
    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const wallet = Keypair.generate();

      const airdropSignature = await connection.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(airdropSignature);

      const mint = await createMint(connection, wallet, wallet.publicKey, null, 0);

      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        mint,
        wallet.publicKey
      );

      await mintTo(connection, wallet, mint, tokenAccount.address, wallet.publicKey, 1);

      console.log('Minted NFT successfully. Token Account:', tokenAccount.address.toString());
    } catch (error) {
      console.error('Error minting NFT:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} ref={cameraRef} type={facing} />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
          <Text style={styles.text}>Flip Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={captureImage}>
          <Text style={styles.text}>Capture Image</Text>
        </TouchableOpacity>

        {imageUri && (
          <TouchableOpacity style={styles.button} onPress={mintNFT} disabled={isUploading || isMinting}>
            {isMinting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.text}>Mint NFT</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {isUploading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1e90ff" />
          <Text style={styles.uploadingText}>Uploading Image...</Text>
        </View>
      )}

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
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  uploadingText: {
    fontSize: 16,
    color: '#1e90ff',
    marginTop: 10,
  },
});
