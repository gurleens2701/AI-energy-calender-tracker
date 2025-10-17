import React, { useState } from 'react'
import { Alert, StyleSheet, View, Button, TextInput } from 'react-native'
import { supabase } from '../supabase-client'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signInWithEmail() {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        Alert.alert('Sign In Error', error.message)
      } else {
        Alert.alert('Success', 'Signed in successfully!')
      }
    } catch (err) {
      const error = err as Error
      Alert.alert('Unexpected Error', error.message)
    }
    finally {
      setLoading(false)
    }
  }

  async function signUpWithEmail() {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) {
        Alert.alert('Sign Up Error', error.message)
      } else if (!data.session) {
        Alert.alert('Verify Email', 'Please check your inbox for email verification!')
      }
    } catch (err) {
      if (err instanceof Error) {
        Alert.alert('Unexpected Error', err.message)
      } else {
        Alert.alert('Unexpected Error', String(err))
      }
    }
    finally {
      setLoading(false)
    }
  }

  async function signOutUser() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error.message);
      } else {
        console.log("User signed out successfully.");
      }
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        onChangeText={setEmail}
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#666"
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        autoCapitalize="none"
        style={styles.input}
      />
      <View style={styles.button}>
        <Button title="Sign in" disabled={loading} onPress={signInWithEmail} />
      </View>
      <View style={styles.button}>
        <Button title="Sign up" disabled={loading} onPress={signUpWithEmail} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
    padding: 12,
    backgroundColor: '#ffffff',  // ✅ White background
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#ffffff',  // ✅ White input background
    color: '#000000',            // ✅ Black text
  },
  button: {
    marginVertical: 6,
  },
})