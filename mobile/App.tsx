import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ExpenseTrackerScreen } from './src/screens/ExpenseTrackerScreen'

const App = () => {
  return (
    <View style={styles.container}>
      {/* <Text>App</Text> */}
      <ExpenseTrackerScreen />
    </View>
  )
}

export default App

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})