import React, { useEffect, useState } from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import HomeScreen from "../screens/HomeScreen";
import CameraScreen from "../screens/CameraScreen";
import ResultScreen from "../screens/ResultScreen";
import CadastroProdutoScreen from "../screens/CadastroProdutoScreen";
import HistoryScreen from "../screens/HistoryScreen";
import AccountScreen from "../screens/AccountScreen";

import { supabase } from "../config/supabase";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [sessao, setSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function verificarSessao() {
      const { data, error } =
        await supabase.auth.getSession();

      if (error) {
        console.warn(
          "[Auth] Erro ao verificar sessão:",
          error
        );
      }

      setSessao(data?.session ?? null);
      setCarregando(false);
    }

    verificarSessao();

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSessao(session);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  if (carregando) {
    return null;
  }

  return (
    <NavigationContainer>
      {sessao ? (

        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: "#1F3864",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "700",
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: "NutriScan",
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Conta"
            component={AccountScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Camera"
            component={CameraScreen}
            options={{
              title: "NutriScan",
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Resultado"
            component={ResultScreen}
            options={{
              title: "Resultado da Análise",
            }}
          />

          <Stack.Screen
            name="CadastroProduto"
            component={CadastroProdutoScreen}
            options={{
              title: "Cadastrar Produto",
            }}
          />

          <Stack.Screen
            name="Historico"
            component={HistoryScreen}
            options={{
              title: "Histórico",
            }}
          />
        </Stack.Navigator>
      ) : (

        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: "#1F3864",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "700",
            },
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              title: "Login",
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Cadastro"
            component={SignupScreen}
            options={{
              title: "Criar conta",
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}