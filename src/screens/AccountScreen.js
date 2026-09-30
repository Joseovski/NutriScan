import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "../config/supabase";

export default function AccountScreen({ navigation }) {
  const [saindo, setSaindo] = useState(false);

  async function sairDaConta() {
    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja sair da sua conta?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              setSaindo(true);

              const { error } =
                await supabase.auth.signOut();

              if (error) {
                throw error;
              }

              console.log(
                "[Auth] Usuário saiu da conta."
              );

            } catch (error) {
              console.warn(
                "[AccountScreen] Erro ao sair:",
                error
              );

              Alert.alert(
                "Erro",
                "Não foi possível sair da conta. Tente novamente."
              );

            } finally {
              setSaindo(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom"]}
    >
      <View style={styles.content}>

        {/* CABEÇALHO */}

        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>
              ←
            </Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Minha conta
          </Text>

        </View>

        {/* INFORMAÇÕES DA CONTA */}

        <View style={styles.accountCard}>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              👤
            </Text>
          </View>

          <Text style={styles.accountTitle}>
            Conta NutriScan
          </Text>

          <Text style={styles.accountDescription}>
            Sua conta está conectada ao NutriScan.
          </Text>

        </View>

        {/* OPÇÕES */}

        <View style={styles.options}>

          <TouchableOpacity
            style={styles.option}
            onPress={sairDaConta}
            disabled={saindo}
          >

            <View style={styles.optionIcon}>
              <Text style={styles.iconText}>
                🚪
              </Text>
            </View>

            <View style={styles.optionContent}>

              <Text style={styles.optionTitle}>
                {saindo
                  ? "Saindo..."
                  : "Sair da conta"}
              </Text>

              <Text style={styles.optionDescription}>
                Encerrar sua sessão neste dispositivo.
              </Text>

            </View>

          </TouchableOpacity>

        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E9EDF3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  backButtonText: {
    fontSize: 25,
    color: "#1F3864",
    fontWeight: "600",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F3864",
  },

  accountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 24,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,

    elevation: 2,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E8EEF7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  avatarText: {
    fontSize: 32,
  },

  accountTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 6,
  },

  accountDescription: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
  },

  options: {
    gap: 12,
  },

  option: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  optionIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#E8EEF7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  iconText: {
    fontSize: 22,
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F3864",
    marginBottom: 4,
  },

  optionDescription: {
    fontSize: 13,
    color: "#777",
    lineHeight: 18,
  },

});