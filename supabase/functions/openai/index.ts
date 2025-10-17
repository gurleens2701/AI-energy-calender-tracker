import OpenAI from 'https://deno.land/x/openai@v4.24.0/mod.ts'

Deno.serve(async (req) => {
  try {
    const { taskData } = await req.json()
    console.log("Received taskData:", taskData)
    
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response('API key not configured', { status: 500 })
    }
    
    const openai = new OpenAI({ apiKey })
    
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: "You are a productivity analyst. Be concise and format output cleanly."
        },
        {
          role: 'user',
          content: `Analyze task completion data.

TODAY'S COMPLETED TASKS (${(taskData.todays_completed_tasks || []).length} tasks):
${JSON.stringify(taskData.todays_completed_tasks || [])}

THIS WEEK'S COMPLETED TASKS:
${JSON.stringify(taskData.completed_tasks)}

TYPICAL COMPLETION TIMES:
${JSON.stringify(taskData.taskTimingStats)}

INSTRUCTIONS:
- For daily insights, analyze ALL tasks in TODAY'S COMPLETED TASKS array
- Include ALL tasks with "medium focus" or "great focus" 
- When a task has duration (e.g., "Coding - 5 hour"), add duration to start hour for peak window
- Format times in 12-hour AM/PM format
- Keep it simple and readable

OUTPUT FORMAT (follow exactly):

=== DAILY INSIGHTS ===
Peak productivity hours:
- 11:00 AM - 1:00 PM (Workout - medium focus)
- 12:00 PM - 5:00 PM (Coding - great focus)

=== WEEKLY INSIGHTS ===
Peak productivity windows:
- 9:00 AM - 11:00 AM (Workout)
- 12:00 PM - 5:00 PM (Coding)

Task timing recommendations:
- Workout: 9:00 AM
- Coding: 12:00 PM

Suggested schedule:
- Workout: 9:00 AM
- Coding: 12:00 PM`
        }
      ],
      model: 'gpt-3.5-turbo',
      stream: false,
    })
    
    const reply = chatCompletion.choices[0].message.content
    console.log("OpenAI reply:", reply)
    
    return new Response(reply, {
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (error) {
    console.error("Edge function error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})