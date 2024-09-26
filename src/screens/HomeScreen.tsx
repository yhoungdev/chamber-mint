import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { Section } from "../Section";
import { useAuthorization } from "../utils/useAuthorization";
import { AccountDetailFeature } from "../components/account/account-detail-feature";
import { SignInFeature } from "../components/sign-in/sign-in-feature";
import CameraScreen from "../components/misc/getCameraAndLocation";

export function HomeScreen() {
  const { selectedAccount } = useAuthorization();

  return (
    <View style={styles.screenContainer}>
      {/* <Text
        style={{ fontWeight: "bold", marginBottom: 12 }}
        variant="displaySmall"
      >
        Solana Mobile Expo Template
      </Text>
      {selectedAccount ? (
        <AccountDetailFeature />
      ) : (
        <>
        
     
      
          <SignInFeature />
        </>
      )} */}

      <CameraScreen/>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    padding: 16,
    flex: 1,
  },
  buttonGroup: {
    flexDirection: "column",
    paddingVertical: 4,
  },
});
