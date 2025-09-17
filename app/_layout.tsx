import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import { Alert } from 'react-native';
import { RootStackParamList } from "../types";
import AddTask from "./AddTask";
import TaskList from "./index";


// PARENT FILE WHERE DATA IS INITIALIZED IN STATE AND TASK OBJECT AND LOGIC IS ADDED IN PARENT COMPONENT FILE BEFORE IMPLEMENTING THE USECASE IN CHILD FILE/COMPONENTS/



const Stack = createStackNavigator<RootStackParamList>();

const Layout = () => {
    
//STATE WHICH HELPS DATA FLOW TO CHILD COMPONENTS OR THROUGHT THE PROJECT
    const [tasks, setTasks] = useState<{
      title: string, 
      description: string, 
      completed: boolean,
      lastToggled?: string, 
      priority?: string, 
      mood?: string 
    }[]>([]);

    // LOGIC FOR ADDTASK FUNCTION 
    // THIS IS THE DATA THATS BEING INITIALIZED AND WILL BE USED IN ADDTASK.TSX FORM 
    // ASYNC STORAGE IS BEING IMPLEMETED HERE 
   
    const addTask = async (title: string, description: string, priority: string ) => {
        const newTask = {
          title: title, 
          description: description, 
          completed: false, 
          lastToggled: undefined, 
          priority: priority , 
          mood: undefined };
        
        const newTasks = [...tasks, newTask]; //PREVIOUS TASKS, NEW TASKS IS BEING ADDED ON TOP OF PREVIOUS TASKS IN NEWTASKS TASK OBJECT 
        setTasks(newTasks);
        try {
            await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
        } catch (error) {
            console.error('Error saving task:', error);
            Alert.alert('Error', 'Failed to save task. Please try again.');
        }

        
    }

    //THIS IS THE LOGIC FOR DELETE FUNCTION ALONGWITH ASYNC STORAGE TO  PERSIST THE DATA
    //WE ARE USING INDEX METHOD THAT GOES FROM 0 TO NUMBER(S) IN ARRAY

    const deleteToDo = async (index : number) => {
        const newTasks = tasks.filter((_, i) => i !== index); // Give me all tasks EXCEPT the one at position index
        setTasks(newTasks); //NEW UPDATED ARRAY WITH DELETED TASK
        try {
            await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
        } catch (error) {
            console.error('Error deleting task:', error);
            Alert.alert('Error', 'Failed to delete task. Please try again.');
        }
        
        }

    // THIS IS THE LOGIC FOR ON TOGGLE COMPLETE ALONG WITH ASYNC STORAGE TO PERSIST THE DATA \
    // THIS FUNCTION SAYS WHAT TICKING/UNTICKING CHECKBOX WILL DO
        const onToggleComplete = async (index: number) => {
          const task = tasks[index];
         
          
          // If task is being completed (false -> true), ask for mood
          //ALERT POP UP FOR MOOD SELECTION
          if (!task.completed) {
              Alert.alert(
                  "Focus Level",
                  "How was your focus on this task?",
                  [
                      { text: "Low Focus", onPress: () => updateTaskWithMood(index, "low focus") },
                      { text: "Medium Focus", onPress: () => updateTaskWithMood(index, "medium focus") },
                      { text: "Great Focus", onPress: () => updateTaskWithMood(index, "great focus") },
                      { text: "Cancel", style: "cancel" }
                  ]
              );
          } else {
              // If unchecking, just toggle normally
              updateTaskWithMood(index, undefined);
          }
      };
      
      // THIS IS PART OF THE ONTOGGLE FUNCTION THAT UPDATES TASK WITH MOOD ALONG WITH LASTTOGGLED WHEN TICKED AND MOOD 
      const updateTaskWithMood = async (index: number, mood?: string) => {
       
          const newTasks = tasks.map((task, i) =>  // "Go through all tasks. When you find the one at position index, update it. Leave all others exactly the same."
              i === index 
                  ? { 
                      ...task, // exisiting properties thats what ... operator is
                      completed: !task.completed, // flip true/false
                      lastToggled: !task.completed ? new Date().toLocaleString() : task.lastToggled, // task is completed so add timestamp otherwise keep existing stamp when unchecked
                      mood: mood //add mood on toggle
                    } 
                  : task
          );

        

          setTasks(newTasks);
          try {
              await AsyncStorage.setItem('tasks', JSON.stringify(newTasks));
              console.log("Tasks saved successfully to AsyncStorage");
          } catch (error) {
              console.error('Error updating task:', error);
              Alert.alert('Error', 'Failed to update task. Please try again.');
          }

         
      };
        // function to load data
    const loadData = async () => {
        try {
            const storedData = await AsyncStorage.getItem('tasks');
            if (storedData !== null) {
                setTasks(JSON.parse(storedData));
            }
        }   catch (error) {
                console.error('Error loading data:', error);
                Alert.alert('Error', 'Failed to load data.');

        }
    }; 
    
    //load data when the compount mounts 
    useEffect (() => {
        loadData();
    }, []); //// Empty dependency array ensures it runs only once on mount

    
    



  return (
    <Stack.Navigator initialRouteName="TaskList">
      <Stack.Screen
        name="TaskList"
        
        options={{ headerTitle: "Task List" }}>

        {(props) => <TaskList {...props} tasks={tasks} deleteToDo={deleteToDo} onToggleComplete={onToggleComplete} />}
        </Stack.Screen>
        

   
      <Stack.Screen
      
        name="AddTask"
        options={{ headerTitle: "Add Task" }} >
            {(props) => <AddTask {...props} addTask={addTask} />}

        </Stack.Screen>
        
        
        
    </Stack.Navigator>
  );
};

export default Layout;
