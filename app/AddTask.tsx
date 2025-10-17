import { View, Text, TouchableOpacity, StyleSheet , TextInput, FlatList, Button, Alert, ScrollView} from "react-native";
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from "../types";

// this is the UI logic for addtask form . 

const AddTask = ({ addTask }: { addTask: (title: string, description: string, priority: string) => void }) => {

   
    //User types "Buy groceries" → title state updates in real-time
    //User types "Get milk and bread" → description state updates
    //User clicks "Save" → All form data gets passed to addTask() function
    //addTask() creates a new task and adds it to the permanent tasks array
    //Form data gets cleared, user goes back to task list
    const [title, setTitle, ] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('');

  
    const navigation = useNavigation();

    const handleSaveTask = () => {
        // Validate title is not empty (trim whitespace)
        if (title.trim() === '') {
            Alert.alert('Validation Error', 'Please enter a task title.');
            return;
        }
       

        // If validation passes, save task and go back
        addTask(title.trim(), description.trim(), priority.trim());
        navigation.goBack();
     
    
       
    };
    

    
// textinput that retrieves user answer and sets state 
// priority button selection
    return (
       
        <ScrollView style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="title || completion time ( workout - 1 hour)"
                placeholderTextColor="#555" 
                value={title}
                onChangeText={setTitle}
            />

            <TextInput
                style={styles.input}
                placeholder="description"
                placeholderTextColor="#555" 
                value={description}
                onChangeText={setDescription}

                
            />
            
            <TouchableOpacity> 

                <TouchableOpacity style={styles.pbuttonl} onPress={() => setPriority('low')}>
                    <Text style={styles.addButtonText}>low</Text>
                

                </TouchableOpacity>
                <TouchableOpacity style={styles.pbuttonm} onPress={() => setPriority("medium")}>
                    <Text style={styles.addButtonText}>medium</Text>
                

                </TouchableOpacity>
                <TouchableOpacity style={styles.pbuttonh} onPress={() => setPriority("high")}>
                    <Text style={styles.addButtonText}>high</Text>
                

                </TouchableOpacity>
                <Text>Selected priority: {priority}</Text>
            
            </TouchableOpacity>
            


            <TouchableOpacity style={styles.addButton} onPress={handleSaveTask}>
                <Text style={styles.addButtonText}>Save</Text>
            </TouchableOpacity>
        </ScrollView>
       
    );
};

//ui design jsx

const styles = StyleSheet.create({
    container : {
      padding: 20,
    },
    input :{
      height: 45,
      borderColor: "#ccc",
      borderWidth: 1.5,
      borderRadius: 8,
      paddingHorizontal: 12,
      marginBottom: 15,
      fontSize: 16,
      backgroundColor: "#fff",
      color: "#000", // ADD THIS - makes text black/bright
        fontWeight: "500", // ADD THIS - makes text slightly bolder
    },
    addButton: {
        backgroundColor: "#007AFF",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        elevation: 3,             // shadow on Android
        shadowColor: "#000",      // shadow on iOS
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        marginTop: 10,
        alignItems: 'center',
        justifyContent: 'center',
      },
      addButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
      },
      pbuttonl: {
        backgroundColor: '#4CAF50', // Green for low
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
      },
      pbuttonm: {
        backgroundColor: '#FF9800', // Orange for medium
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
      },
      pbuttonh: {
        backgroundColor: '#f44336', // Red for high
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
      },
  
  
  });



export default AddTask