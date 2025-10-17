import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Session } from '@supabase/supabase-js';
import React, { useEffect, useState } from "react";
import { Alert, View, Text, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import 'react-native-url-polyfill/auto';
import Auth from "../components/Auth"; // Add this import
import { supabase } from "../supabase-client";
import { RootStackParamList } from "../types";
import AddTask from "./AddTask";
import TaskList from "./index";
import Stats from "./Stats"



// PARENT FILE WHERE DATA IS INITIALIZED IN STATE AND TASK OBJECT AND LOGIC IS ADDED IN PARENT COMPONENT FILE BEFORE IMPLEMENTING THE USECASE IN CHILD FILE/COMPONENTS/



const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootStackParamList>();

const Layout = () => {
  //     Auth   //

  const [session, setSession] = useState<Session | null>(null)
  //STATE WHICH HELPS DATA FLOW TO CHILD COMPONENTS OR THROUGHT THE PROJECT
  const [tasks, setTasks] = useState<{
    id?: number,
    title: string, 
    description: string, 
    is_completed: boolean,
    completed_at?: string, 
    priority?: string, 
    mood?: string 
  }[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [pendingTaskIndex, setPendingTaskIndex] = useState<number | null>(null);
  
   

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })
        
        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })
    }, [])


    // Helper function to check if a date is today
  const isToday = (dateString: string): boolean => {
    const today = new Date();
    const date = new Date(dateString);
    
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
//reset tasks every day
const performDailyReset = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Check if there are any completions today
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const { data: todayCompletions } = await supabase
    .from('task_completions')
    .select('id')
    .eq('user_id', user.id)
    .gte('completed_at', startOfToday.toISOString())
    .limit(1);

  // If there are completions today, we already reset at some point, so skip
  if (todayCompletions && todayCompletions.length > 0) {
    console.log("Already have completions today, skipping reset");
    return;
  }

  // Otherwise, perform the reset
  const { error } = await supabase
    .from('tasks')
    .update({ is_completed: false })
    .eq('user_id', user.id)
    .eq('is_completed', true);

  if (error) {
    console.error("Error during daily reset:", error);
  }
};

    // fetchdata and replace it with asyncstorage
    const fetchdata = async() => {
      console.log("fetchdata() started");
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current user:", user);
      
      if (!user) {
        console.log("No user found, exiting fetchdata");
        Alert.alert('Error', 'You must be logged in to view tasks');
        return;
      }
      

       // Perform daily reset before fetching tasks
        await performDailyReset();


      console.log("Fetching tasks for user:", user.id);
      const { data, error } = await supabase
      .from('tasks')
      .select("*")
      .eq("user_id", user.id) 
      .order("id", { ascending: true });

      if(error) {
        console.error("error reading task", error);
        return;
      }

      setTasks(data)
      console.log("data not loading:", data)
    };


    

    


  

    // LOGIC FOR ADDTASK FUNCTION 
    // THIS IS THE DATA THATS BEING INITIALIZED AND WILL BE USED IN ADDTASK.TSX FORM 
    // ASYNC STORAGE IS BEING IMPLEMETED HERE 
   
    const addTask = async (title: string, description: string, priority: string ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to add tasks');
        return;
      }
        const newTask = {
          title: title, 
          description: description, 
          is_completed: false, 
          completed_at: undefined, 
          priority: priority , 
          mood: undefined };

          const { data, error } = await supabase.from("tasks").insert([
            {
             
              title,
              description,
              priority,
              is_completed: false,
              user_id: user.id
            },
          ]).select();
          console.log("Inserted row:", data);
          if (error) {
            console.error("Supabase insert error:", error);
          }

      
          
        if (data && data[0]) {
          const newTasks = [...tasks, data[0]]; //PREVIOUS TASKS, NEW TASKS IS BEING ADDED ON TOP OF PREVIOUS TASKS IN NEWTASKS TASK OBJECT 
          setTasks(newTasks);
          console.log("Updated tasks array:", newTasks);
        }
    }

    

    //THIS IS THE LOGIC FOR DELETE FUNCTION ALONGWITH ASYNC STORAGE TO  PERSIST THE DATA
    //WE ARE USING INDEX METHOD THAT GOES FROM 0 TO NUMBER(S) IN ARRAY

    const deleteToDo = async (index : number) => {

        const tasktoDelete = tasks[index];
        if(!tasktoDelete?.id) {
          Alert.alert("Error, Task ID Not Found!");
          return;
        }
        
        
        
        const { error } = await supabase.from('tasks').delete().eq('id', tasktoDelete.id);

        if(error) {
          console.error("Supabasae delete fail:", error)
          Alert.alert("failede to delete from server");
          return;
        }
        const newTasks = tasks.filter((_, i) => i !== index); // Give me all tasks EXCEPT the one at position index
        setTasks(newTasks); //NEW UPDATED ARRAY WITH DELETED TASK
        }

    // THIS IS THE LOGIC FOR ON TOGGLE COMPLETE ALONG WITH ASYNC STORAGE TO PERSIST THE DATA \
    // THIS FUNCTION SAYS WHAT TICKING/UNTICKING CHECKBOX WILL DO
    const onToggleComplete = async (index: number) => {
      const task = tasks[index];
      
      if (!task.is_completed) {
        // Show time picker first
        setPendingTaskIndex(index);
        setSelectedTime(new Date());
        setShowTimePicker(true);
      } else {
        // If unchecking, just toggle normally
        updateTaskWithMood(index, undefined);
      }
    };
    
    const confirmCompletionWithTime = () => {
      if (pendingTaskIndex === null) return;
      
      // Now show mood alert
      Alert.alert(
        "Focus Level",
        "How was your focus on this task?",
        [
          { text: "Low Focus", onPress: () => finalizeCompletion(pendingTaskIndex, "low focus") },
          { text: "Medium Focus", onPress: () => finalizeCompletion(pendingTaskIndex, "medium focus") },
          { text: "Great Focus", onPress: () => finalizeCompletion(pendingTaskIndex, "great focus") },
          { text: "Cancel", style: "cancel", onPress: () => {
            setShowTimePicker(false);
            setPendingTaskIndex(null);
          }}
        ]
      );
    };
    
    const finalizeCompletion = async (index: number, mood: string) => {
      const task = tasks[index];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Insert completion record with selected time
      const { error: completionError } = await supabase
        .from('task_completions')
        .insert({
          task_id: task.id,
          user_id: user.id,
          mood: mood,
          completed_at: selectedTime.toISOString()
        });
        
      if (completionError) {
        console.error("Error saving completion:", completionError);
        return;
      }
      
      // Update task completion status
      const newTasks = tasks.map((t, i) =>  
        i === index 
          ? { ...t, is_completed: true } 
          : t
      );
    
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: true })
        .eq('id', task.id);
    
      if (error) {
        console.error("Error updating task:", error);
        return;
      }
      
      setTasks(newTasks);
      setShowTimePicker(false);
      setPendingTaskIndex(null);
    };
      
      // THIS IS PART OF THE ONTOGGLE FUNCTION THAT UPDATES TASK WITH MOOD ALONG WITH LASTTOGGLED WHEN TICKED AND MOOD 
      const updateTaskWithMood = async (index: number, mood?: string) => {
        const task = tasks[index];
        
        if (!task.is_completed && mood) {
          // Task is being completed - add to completions history
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          // Insert completion record
          const { error: completionError } = await supabase
            .from('task_completions')
            .insert({
              task_id: task.id,
              user_id: user.id,
              mood: mood,
              completed_at: new Date().toISOString()
            });
            
          if (completionError) {
            console.error("Error saving completion:", completionError);
            return;
          }
        }
        
        // Update task completion status
        const newTasks = tasks.map((t, i) =>  
          i === index 
            ? { ...t, is_completed: !t.is_completed } 
            : t
        );
      
        const { error } = await supabase
          .from('tasks')
          .update({ is_completed: newTasks[index].is_completed })
          .eq('id', task.id);
      
        if (error) {
          console.error("Error updating task:", error);
          return;
        }
        
        setTasks(newTasks);
      };
    
    //load data when the compount mounts 
    useEffect (() => {
      if(session) {
        fetchdata();
      }
        
    }, [session]); //// Empty dependency array ensures it runs only once on mount

    console.log(tasks);

    
    if (!session) {
      return <Auth />
    }



    return (
      <>
      <Tab.Navigator>
        <Tab.Screen 
          name="TaskList" 
          options={{ headerTitle: "Task List" }}
        >
          {() => (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen
                name="TaskListScreen"
                options={{ headerShown: false }}
              >
                {(props) => <TaskList {...props} tasks={tasks} deleteToDo={deleteToDo} onToggleComplete={onToggleComplete} />}
              </Stack.Screen>
              <Stack.Screen
                name="AddTask"
                options={{ headerTitle: "Add Task", headerShown: true }}
              >
                {(props) => <AddTask {...props} addTask={addTask} />}
              </Stack.Screen>
            </Stack.Navigator>
          )}
        </Tab.Screen>
        
        <Tab.Screen 
          name="Stats" 
          component={Stats}
          options={{ headerTitle: "Statistics" }}
        />
      </Tab.Navigator>
      {showTimePicker && (
  <View style={{
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  }}>
    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#000' }}>
      When did you complete this task?
    </Text>
    <DateTimePicker
      value={selectedTime}
      mode="datetime"
      display="spinner"
      textColor="#000000"
      themeVariant="light"
      onChange={(event, date) => {
        if (date) setSelectedTime(date);
      }}
    />
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#007AFF', padding: 12, borderRadius: 8, flex: 1, marginRight: 10 }}
            onPress={confirmCompletionWithTime}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: '#ff4444', padding: 12, borderRadius: 8, flex: 1 }}
            onPress={() => {
              setShowTimePicker(false);
              setPendingTaskIndex(null);
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    )}
  </>
);
}

export default Layout;
