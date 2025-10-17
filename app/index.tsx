import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Alert , ScrollView} from "react-native";
import { RootStackParamList } from "../types";
import { supabase } from "@/supabase-client";
import DateTimePicker from '@react-native-community/datetimepicker';

type TaskListNavigationProp = NativeStackNavigationProp<RootStackParamList, "TaskList">;

// main page where tasks display

const TaskList = ({ tasks, deleteToDo, onToggleComplete }: { tasks: { title: string; description: string, is_completed: boolean , completed_at?: string, priority?: string , mood?: string}[]; deleteToDo: (index: number) => void; onToggleComplete: (index: number) => void;  }) => {
  const navigation = useNavigation<TaskListNavigationProp>();
  

  // Calculate task statistics
  const completedTasks = tasks.filter(task => task.is_completed).length;
  const totalTasks = tasks.length;



   // Helper function to format date display
   const formatCompletedAt = (completedAt: string | undefined): string => {
    if (!completedAt) return '';
    
    const date = new Date(completedAt);
    const today = new Date();
    
    // Check if it's today
    const isToday = date.getDate() === today.getDate() &&
                   date.getMonth() === today.getMonth() &&
                   date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return `Completed today at ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else {
      return `Completed on ${date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })} at ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
  };

  // Logout function
  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                Alert.alert('Error', 'Failed to logout. Please try again.');
                console.error('Logout error:', error);
              }
            } catch (err) {
              console.error('Logout error:', err);
              Alert.alert('Error', 'An unexpected error occurred during logout.');
            }
          }
        }
      ]
    );
  };


  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Top row for Add button */}
            <View style={styles.headerContainer}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate("AddTask")}
              >
                <Text style={styles.addButtonText}>+ Add Task</Text>
              </TouchableOpacity>
            </View>
  
            {/* Task Counter */}
            {totalTasks > 0 && (
              <View style={styles.counterContainer}>
                <Text style={styles.counterText}>
                  {completedTasks} of {totalTasks} completed today
                </Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No tasks yet! 📝</Text>
            <Text style={styles.emptyStateSubtitle}>Tap 'Add Task' to get started</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={[
            styles.taskCard, 
            item.is_completed ? styles.completedTaskCard : styles.activeTaskCard 
          ]}>
            {/* Your existing task card code stays exactly the same */}
            <View style={styles.taskActions}>
              <TouchableOpacity onPress={() => deleteToDo(index)}>
                <Text style={styles.actionIcon}>🗑</Text>
              </TouchableOpacity>
  
              <TouchableOpacity
                style={[styles.checkbox, item.is_completed && styles.checkboxChecked]}
                onPress={() => onToggleComplete(index)}
              >
                {item.is_completed && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
  
              <View style={styles.taskTextContainer}>
                <Text style={[
                  styles.taskTitle, 
                  item.is_completed && styles.completedText
                ]}>
                  {item.title}
                </Text>
                <Text style={[
                  styles.taskDescription, 
                  item.is_completed && styles.completedText
                ]}>
                  {item.description}
                </Text>
                
                {item.priority && (
                  <Text style={styles.prioritylevel}>
                    Priority: {item.priority}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
};


//ui design of each component above and how they fit on screen.

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  counterContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  counterText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#7B2CBF",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  taskCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  activeTaskCard: {
    backgroundColor: "#f3e8ff", // light purple
    borderColor: "#7B2CBF",
    opacity: 1,
  },
  completedTaskCard: {
    backgroundColor: "#f5f5f5", // light grey
    borderColor: "#ccc",
    opacity: 0.7,
  },
  taskTextContainer: {
    flexDirection: "column",
    flex: 1,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 15,
    color: "#555",
    lineHeight: 20,
  },
  taskActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 20,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderWidth: 2.5,
    borderColor: "#7B2CBF",
    borderRadius: 6,
    marginRight: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#7B2CBF",
  },
  checkmark: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#999",
  },

  timestamp: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic", // Added this line
  },

  prioritylevel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,

  }, 

  moodlevel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontWeight: "600",
},
  
});

export default TaskList;