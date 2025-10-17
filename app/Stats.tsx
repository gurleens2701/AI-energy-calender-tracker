import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from "react";
import { Alert, Animated, ScrollView, StyleSheet, Text, View } from "react-native";

import 'react-native-url-polyfill/auto';
import { supabase } from "../supabase-client";




const Stats = () => {
    console.log("Stats component mounted!");

    const [completion, setCompletion] = useState<{
        id?: number,
        task_id?: number,
        completed_at?: string, 
        mood?: string 
      }[]>([]);

    const [weeklyData, setWeeklyData] = useState<{
        id?: number,
        task_id?: number,
        completed_at?: string, 
        mood?: string 
      }[]>([]);

      const [totalTasks, setTotalTasks] = useState<number>(0);
      const [completionhours, setcompletionHours] = useState<number[]>([]);
      const [taskCompletionStats, setTaskCompletionStats] = useState<{
        taskName: string,
        taskId: number,
        completions: number
      }[]>([]);
      const [taskTimingStats, setTaskTimingStats] = useState<{
        taskName: string,
        taskId: number,
        typicalHour: number
      }[]>([]);
      const [aiInsights, setAiInsights] = useState<{ daily: string, weekly: string }>({ daily: '', weekly: '' });
      const [isLoadingInsights, setIsLoadingInsights] = useState(false);
     

      const [fadeAnim] = useState(new Animated.Value(0));
      
      
    // fetchdata and replace it with asyncstorage
    const fetchdata = async() => {
        console.log("fetchdata() started");
        const { data: { user } } = await supabase.auth.getUser();
        console.log("Current user:", user);
        
        if (!user) {
          console.log("No user found, exiting fetchdata");
          Alert.alert('Error', 'You must be logged in to view tasks');
          setAiInsights({ daily: '', weekly: '' });

          return;
        }

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  
  
        console.log("Fetching tasks for user:", user.id);
        const { data, error } = await supabase
        .from('task_completions')
        .select("*")
        .eq("user_id", user.id) 
        .gte('completed_at', startOfToday.toISOString())
        .lt('completed_at', startOfTomorrow.toISOString())
        .order("id", { ascending: true });

        console.log("Today's completions:", data);
        console.log("Number of completions today:", data?.length);
  
        if(error) {
          console.error("error reading task", error);
          return;
        }

        setCompletion(data);

       // / Extract hours
        const hours = data.map(completion => new Date(completion.completed_at).getHours());
        console.log("Hours:", hours);
        setcompletionHours(hours)

        //array to displaystring
        const displayHours = hours.join(" , ");


        //fetchdata for tasks.count
        const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select("*")
        .eq("user_id", user.id);

        console.log("Number of tasks today:", tasksData?.length);

        if(tasksError) {
            console.error("error reading task", tasksError);
            return;
          }

        setTotalTasks(tasksData?.length || 0);


        //fetching weekly tasks 

        //date object 
        const startOf7DaysAgo = new Date(startOfToday);
        startOf7DaysAgo.setDate(startOfToday.getDate() - 7);

        const { data: weeklyTasks, error: weeklyTasksError  } = await supabase
        .from('task_completions')
        .select("*")
        .eq("user_id", user.id) 
        .gte('completed_at', startOf7DaysAgo.toISOString())
        .lt('completed_at', startOfTomorrow.toISOString())
        .order("id", { ascending: true });

        console.log("weekly's completions:", weeklyTasks);
        console.log("Number of completions weekly:", weeklyTasks?.length);
  
        if(weeklyTasksError) {
          console.error("error reading task", weeklyTasksError);
          return;
        }
        setWeeklyData(weeklyTasks);

        // how many times each task was completed in week?
        //create a array of each task with its id and  how many time it was completed 
        //display how many time each task from that list was completed
        const completionStreaks = weeklyTasks.map(streaks => 
            streaks.task_id);
            console.log(completionStreaks);
        
        const sum: Record<number, number> = completionStreaks.reduce((accumulator, taskId) => {
            if (taskId !== undefined) {
                accumulator[taskId] = (accumulator[taskId] || 0) + 1;
            }
            return accumulator;
        }, {} as Record<number, number>);
        console.log(sum);


        //collect hours in array to caluclate average completion time for each task and dusplay it on ai, also verify with AI insights.
        const taskTimingPatterns = weeklyTasks.reduce((accumulator, completion) => {
            const taskId = completion.task_id;
            
            
            if (taskId !== undefined && completion.completed_at !== undefined) {
                const hour = new Date(completion.completed_at).getHours();
                
                if (!accumulator[taskId]) {
                  accumulator[taskId] = [];
                }
                accumulator[taskId].push(hour);
              }
            return accumulator;
        }, {} as Record<number, number[]>);
        console.log(taskTimingPatterns);

        const taskTimingStats = Object.entries(taskTimingPatterns).map(([taskId, hours]) => {
    
            // COUNT FOR THIS TASK'S HOURS
            const hourCounts = hours.reduce((accumulator, taskhour) => {
                if (taskhour !== undefined) {
                    accumulator[taskhour] = (accumulator[taskhour] || 0) + 1;
                }
                return accumulator;
            }, {} as Record<number, number>);
            
            // FIND MAX FROM THIS TASK'S hourCounts (not typicalHour)
            const maxCount = Math.max(...Object.values(hourCounts));
            const mostCommonHour = Number(Object.keys(hourCounts).find((hour) => {
                return hourCounts[Number(hour)] == maxCount;
            }));
            
            const task = tasksData?.find(t => t.id === parseInt(taskId));
            
            return {
                taskId: parseInt(taskId),
                taskName: task?.title || 'Unknown Task',
                typicalHour: mostCommonHour
            };
        });
        
        
        console.log(taskTimingStats);
        setTaskTimingStats(taskTimingStats);

        //match taskID with completed each task and fetch the name for displaying it in UI
        
        
        const typicalHourStats = Object.entries(sum).map(([taskId, completions]) => {
            const task = tasksData?.find(t => t.id === parseInt(taskId));
            return {
                taskId: parseInt(taskId),
                taskName: task?.title || 'Unknown Task',
                completions: completions
            };
        });
        
        console.log("Task completion stats:", typicalHourStats);
        setTaskCompletionStats(typicalHourStats);

          //trasnforming the data to feed into AI for daily/weekly analyisation//
        //transforming the data to feed into AI for daily/weekly analysis//
const prepareData = () => {
  // Get today's date range
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Filter completions by today vs. this week
  const todaysCompletions = weeklyTasks.filter(completion => {
    if (!completion.completed_at) return false;
    const completionDate = new Date(completion.completed_at);
    return completionDate >= startOfToday;
  });
  
  console.log("Today's filtered completions:", todaysCompletions.length); // Debug
  
  // Map all weekly completions
  const completed_tasks = weeklyTasks.map(completion => {
    if (!completion.completed_at || !completion.task_id) return null;
    const taskId = completion.task_id;
    const mood = completion.mood;
    const hour = new Date(completion.completed_at).getHours();
    const date = new Date(completion.completed_at).toISOString().split('T')[0]; // YYYY-MM-DD

    const task = tasksData?.find(t => t.id === completion.task_id);
    
    return {
      taskName: task?.title || 'Unknown Task',
      hour: hour,
      mood: mood,
      priority: task?.priority || 'medium',
      date: date
    };
  }).filter(task => task !== null); // Remove nulls
  
  // Map today's completions separately
  const todays_completed_tasks = todaysCompletions.map(completion => {
    if (!completion.completed_at || !completion.task_id) return null;
    const mood = completion.mood;
    const hour = new Date(completion.completed_at).getHours();

    const task = tasksData?.find(t => t.id === completion.task_id);
    
    return {
      taskName: task?.title || 'Unknown Task',
      hour: hour,
      mood: mood,
      priority: task?.priority || 'medium'
    };
  }).filter(task => task !== null);

  console.log("Today's completed tasks for AI:", todays_completed_tasks); // Debug

  // Create missed tasks array
  const completedTaskIds = new Set(weeklyTasks.map(c => c.task_id));
  const missed_tasks = tasksData?.filter(task => !completedTaskIds.has(task.id))
    .map(task => ({
      taskName: task.title,
      priority: task.priority || 'medium'
    })) || [];

  return { 
    completed_tasks,           // All week completions
    todays_completed_tasks,    // ✅ TODAY ONLY
    missed_tasks, 
    taskTimingStats 
  };
};

        // If no weekly tasks, don't call AI
        if (!weeklyTasks || weeklyTasks.length === 0) {
            setAiInsights({ daily: '', weekly: '' });
            return;
          }




          const aiReadyData = prepareData();
          console.log("=== SENDING TO AI ==="); // ✅ ADD THIS
          console.log("todays_completed_tasks:", JSON.stringify(aiReadyData.todays_completed_tasks)); // ✅ ADD THIS
          console.log("Full aiReadyData:", JSON.stringify(aiReadyData)); // ✅ ADD THIS
          setIsLoadingInsights(true);
       

          

              // Add your fetch call here
              const { data: aiData, error: aiError } = await supabase.functions.invoke('openai', {
                body: { taskData: aiReadyData }
              });

              setIsLoadingInsights(false); 

              
              
              if (aiError) {
                console.error("Edge function error:", aiError);
                Alert.alert("Unable to generate insights. Please try again later.");
                return;
              }

              
              
          // Parse the insights with fallback
          const insightsText = aiData || '';

          // Try multiple split patterns
          let sections = insightsText.split('### WEEKLY INSIGHTS ###');
          if (sections.length === 1) {
            sections = insightsText.split('=== WEEKLY INSIGHTS ===');
            }
          if (sections.length === 1) {
            sections = insightsText.split('WEEKLY INSIGHTS');
            }

          const dailyInsights = sections[0]
          .replace('### DAILY INSIGHTS ###', '')
          .replace('=== DAILY INSIGHTS ===', '')
          .replace('DAILY INSIGHTS', '')
          .trim();
  
          const weeklyInsights = sections[1]?.trim() || '';   
          setAiInsights({ daily: dailyInsights, weekly: weeklyInsights });
    };

       
        
        
//load when app mounts
 useEffect(() => {
    fetchdata();
  }, []);
  

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);


      
    
  
      
    return (
        <ScrollView style={styles.container}>
          <Animated.View style={{ opacity: fadeAnim }}>
        {/* Daily Section */}
        <View style={styles.dailySection}>
        <Text style={styles.sectionTitle}>📊 Today's Stats</Text>
        
        
        <View style={styles.statsRow}>
        <LinearGradient colors={['#4CAF50', '#45a049']} style={[styles.statBox, styles.completedBox]}>
         <Text style={styles.statNumber}>{completion.length}</Text>
         <Text style={styles.statLabel}>✅ Completed</Text>
        </LinearGradient>

        <LinearGradient colors={['#f44336', '#e53935']} style={[styles.statBox, styles.missedBox]}>
          <Text style={styles.statNumber}>{totalTasks - completion.length}</Text>
          <Text style={styles.statLabel}>❌ Missed</Text>
        </LinearGradient>
        </View>
      

            <Text style={styles.insight}>
            You completed {completion.length} out of {totalTasks} tasks today
           </Text>
          
           {isLoadingInsights ? (
           <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>💭 Generating AI insights...</Text>
           </View>
            ) : aiInsights.daily && (
            <View style={styles.insightsContainer}>
             <Text style={styles.mainInsightsTitle}>💡 Daily Insights</Text>
    
            <View style={styles.insightSection}>
              {aiInsights.daily
                .split('\n')
                .filter(line => line.trim())
                .map((line, i) => {
                  const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
                  
                  if (cleanLine.includes('===')) return null;
                  
                  if (cleanLine.endsWith(':')) {
                    return (
                      <Text key={i} style={styles.sectionHeader}>
                        {cleanLine}
                      </Text>
                    );
                  }
                  
                  return (
                    <Text key={i} style={styles.sectionItem}>
                      {cleanLine.startsWith('•') ? cleanLine : `• ${cleanLine}`}
                    </Text>
                  );
                })
                .filter(item => item !== null)
              }
            </View>
  </View>
)}
           

      </View>

        
        
        
        {/* Weekly Section - for later */}
        <View style={styles.weeklySection}>
        <Text style={styles.sectionTitle}>📈 Weekly Stats</Text>

        <View style={styles.statsRow}>
          <LinearGradient colors={['#4CAF50', '#45a049']} style={[styles.statBox, styles.completedBox]}>
            <Text style={styles.statNumber}>{weeklyData.length}</Text>
            <Text style={styles.statLabel}>✅ Completed</Text>
          </LinearGradient>

          <LinearGradient colors={['#9C27B0', '#7B1FA2']} style={[styles.statBox, styles.missedBox]}>
            <Text style={styles.statNumber}>
            {totalTasks > 0 ? Math.round((weeklyData.length / (totalTasks * 7)) * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>📊 Completion Rate</Text>
          </LinearGradient>
        </View>

         
        
        {/* Task Completion Breakdown */}
        <View style={styles.taskBreakdown}>
              <Text style={styles.breakdownTitle}>🎯 Task Breakdown:</Text>
              {taskCompletionStats.map((stat) => (
                <View key={stat.taskId} style={styles.taskStatRow}>
                  <Text style={styles.taskStatName}>{stat.taskName}</Text>
                  <Text style={styles.taskStatCount}>{stat.completions}x</Text>
                </View>
              ))}
            </View>
        {/* Typical Completion Times */}
        <View style={styles.taskBreakdown}>
                <Text style={styles.breakdownTitle}>⏰  Typical Completion Times:</Text>
                {taskTimingStats.map((stat) => (
            <View key={stat.taskId} style={styles.taskStatRow}>
                <Text style={styles.taskStatName}>{stat.taskName}</Text>
                <Text style={styles.taskStatCount}>{stat.typicalHour}:00</Text>
        </View>
        ))}
            </View>
            {aiInsights.weekly && (
  <View style={styles.insightsContainer}>
    <Text style={styles.mainInsightsTitle}>💡 Weekly Insights</Text>

    {isLoadingInsights ? (
  <View style={styles.loadingBox}>
    <Text style={styles.loadingText}>💭 Generating weekly insights...</Text>
  </View>
    ) : (
      <View style={styles.insightSection}>
        {aiInsights.weekly
          .split('\n')
          .filter(line => line.trim())
          .map((line, i) => {
            const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
            
            if (cleanLine.includes('===')) return null;
            
            if (cleanLine.endsWith(':')) {
              return (
                <Text key={i} style={styles.sectionHeader}>
                  {cleanLine}
                </Text>
              );
            }
            
            return (
              <Text key={i} style={styles.sectionItem}>
                {cleanLine.startsWith('•') ? cleanLine : `• ${cleanLine}`}
              </Text>
            );
          })
          .filter(item => item !== null)
        }
      </View>
    )
    }
  </View>
)}
           
  
            
        
          
          </View>
          </Animated.View>

          
        </ScrollView>
       );

};
  


  const styles = StyleSheet.create({
    container: {
        flex:1,
        padding: 20,
        backgroundColor: '#fff',


    },
    dailySection: {
        backgroundColor: '#fff', // ADD THIS
        padding: 20, // ADD THIS
        marginBottom: 20, // ADD THIS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderRadius: 16,


    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#7B2CBF',

    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 16,
      },
      completedBox: {
        backgroundColor: '#4CAF50',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        minWidth: 100,
      },
      missedBox: {
        backgroundColor: '#f44336',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        minWidth: 100,
      },
      insightHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#7B2CBF',
        marginTop: 16,
        marginBottom: 8,
      },
      statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
      },
      statLabel: {
        fontSize: 14,
        color: '#fff',
        marginTop: 4,
      },
      insight: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#666',
        marginTop: 12,
      },
      weeklySection: {
        backgroundColor: '#fff', // ADD THIS
        padding: 20, // ADD THIS
        marginBottom: 20, // ADD THIS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderRadius: 16,
      },

      taskBreakdown: {
        marginTop: 20,
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
      },
      breakdownTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#7B2CBF',
        marginBottom: 8,
      },
      taskStatRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
      },
      taskStatName: {
        fontSize: 14,
        color: '#333',
        flex: 1,
      },
      taskStatCount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#7B2CBF',
      },
      insightsBox: {
        marginTop: 16,
        padding: 16, // Increase from 12
        backgroundColor: '#fff', // Change from #f0e6ff
        borderRadius: 12,
        borderWidth: 2, // Add border
        borderColor: '#7B2CBF',
        shadowColor: '#7B2CBF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
      },
      insightsTitle: {
        fontSize: 18, // Increase from 16
        fontWeight: '900', // Change from 'bold'
        color: '#7B2CBF',
        marginBottom: 8,
      },
      insightsText: {
        fontSize: 14, // Reduce from 15
        fontWeight: '500', // Reduce from 600
        color: '#333', // Lighter than black
        lineHeight: 22,
        flex: 1,
      },
      statBox: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
      insightBold: {
        fontWeight: 'bold',
        color: '#7B2CBF',
      },
      insightRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
      },
      bullet: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#7B2CBF',
        marginRight: 8,
        marginTop: 2,
      },
      insightsContainer: {
        marginTop: 16,
      },
      mainInsightsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#7B2CBF',
        marginBottom: 12,
      },
      insightSection: {
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#7B2CBF',
        marginBottom: 8,
      },
      sectionHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: '#7B2CBF',
        marginTop: 8,
        marginBottom: 6,
      },
      sectionItem: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
        lineHeight: 22,
        marginBottom: 4,
        paddingLeft: 4,
      },

      loadingBox: {
        marginTop: 16,
        padding: 20,
        backgroundColor: '#f0e6ff',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#7B2CBF',
      },
      loadingText: {
        fontSize: 16,
        color: '#7B2CBF',
        fontWeight: '600',
      },


})
  
  export default Stats;