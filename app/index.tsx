import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RootStackParamList } from "../types";

type TaskListNavigationProp = NativeStackNavigationProp<RootStackParamList, "TaskList">;

// main page where tasks display

const TaskList = ({ tasks, deleteToDo, onToggleComplete }: { tasks: { title: string; description: string, completed: boolean , lastToggled?: string, priority?: string , mood?: string}[]; deleteToDo: (index: number) => void; onToggleComplete: (index: number) => void;  }) => {
  const navigation = useNavigation<TaskListNavigationProp>();
  

  // Calculate task statistics
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;



  return (
    <View style={styles.container}>
      {/* Top row for Add button */}
      <View style={styles.headerContainer}>
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
            {completedTasks} of {totalTasks} completed
          </Text>
        </View>
      )}

      {/* Empty State */}
      {totalTasks === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No tasks yet! 📝</Text>
          <Text style={styles.emptyStateSubtitle}>Tap 'Add Task' to get started</Text>
        </View>
      ) : (
        /* Task list */
        <FlatList
          data={tasks}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item , index}) => (
            <View style={[
              styles.taskCard, 
              item.completed ? styles.completedTaskCard : styles.activeTaskCard
            ]}>

              {/* Right side: delete + checkbox placeholder */}
              <View style={styles.taskActions}>
                {/* Later this □ will toggle to ☑ */}
                <TouchableOpacity onPress={() => deleteToDo(index)}>
                    <Text style={styles.actionIcon}>🗑</Text>
                </TouchableOpacity>

              {/* Checkbox */}
              <TouchableOpacity
                style={[styles.checkbox, item.completed && styles.checkboxChecked]}
                onPress={() => onToggleComplete(index)}
                
                
              >
                {item.completed &&  <Text style={styles.checkmark}>✓</Text>}
                
                
                
              </TouchableOpacity>

              {/* Task text */}
              <View style={styles.taskTextContainer}>
                <Text style={[
                  styles.taskTitle, 
                  item.completed && styles.completedText
                ]}>
                  {item.title}
                </Text>
                <Text style={[
                  styles.taskDescription, 
                  item.completed && styles.completedText
                ]}>
                  {item.description}
                </Text>
                {item.lastToggled && (
                <Text style={styles.timestamp}>Last Toggled: {item.lastToggled}</Text>
                )}
             
                
                {item.priority && (
                <Text style={styles.prioritylevel}>
                    Priority: {item.priority}
                </Text>
                )}

                {item.mood && (
                  <Text style={styles.moodlevel}>
                    mood: {item.mood}
                  </Text>
                )}



               
              </View>

              </View>
            </View>
          )}
        />
      )}
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
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 20,
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