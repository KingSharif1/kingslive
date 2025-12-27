"use client"

import { useState, useEffect } from "react"
import { Check, Plus, Trash2, Calendar, Flag, Loader2, RefreshCw, Download, Repeat, Flame, X, ChevronDown, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { supabase } from "@/lib/supabase"

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: "high" | "medium" | "low"
  due_date?: string
  category?: string
  created_at: string
  is_habit?: boolean
  frequency?: "daily" | "weekly" | "weekdays" | null
  streak?: number
  best_streak?: number
  last_completed?: string
  color?: string
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium")
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>("")
  const [newTaskIsHabit, setNewTaskIsHabit] = useState(false)
  const [newTaskFrequency, setNewTaskFrequency] = useState<"daily" | "weekly" | "weekdays">("daily")
  const [activeTab, setActiveTab] = useState("all")
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true, nullsFirst: false })

      if (error) {
        console.error('Error fetching tasks:', error)
        // Table might not exist - show empty state
        setTasks([])
        return
      }
      // Sort: incomplete with due dates first, then incomplete without dates, then completed
      const sorted = (data || []).sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        if (a.due_date) return -1
        if (b.due_date) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      setTasks(sorted)
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const addTask = async () => {
    if (newTaskTitle.trim() === "") return
    setIsSaving(true)

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          priority: newTaskPriority,
          due_date: newTaskDueDate || null,
          completed: false,
          is_habit: newTaskIsHabit,
          frequency: newTaskIsHabit ? newTaskFrequency : null,
          streak: 0,
          best_streak: 0
        })
        .select()
        .single()

      if (error) throw error

      setTasks(prev => {
        const updated = [data, ...prev]
        return updated.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1
          if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          if (a.due_date) return -1
          if (b.due_date) return 1
          return 0
        })
      })
      // Reset form
      setNewTaskTitle("")
      setNewTaskDescription("")
      setNewTaskPriority("medium")
      setNewTaskDueDate("")
      setNewTaskIsHabit(false)
      setNewTaskFrequency("daily")
      setShowAddForm(false)
    } catch (err) {
      console.error('Error adding task:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const today = new Date().toISOString().split('T')[0]
    const isCompleting = !task.completed

    try {
      let updateData: any = {
        completed: isCompleting,
        updated_at: new Date().toISOString()
      }

      // Handle habit streak logic
      if (task.is_habit && isCompleting) {
        const lastCompleted = task.last_completed
        let newStreak = (task.streak || 0) + 1

        // Check if streak should continue or reset
        if (lastCompleted) {
          const lastDate = new Date(lastCompleted)
          const todayDate = new Date(today)
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

          // Reset streak if more than 1 day gap (for daily habits)
          if (task.frequency === 'daily' && diffDays > 1) {
            newStreak = 1
          }
        }

        updateData.streak = newStreak
        updateData.best_streak = Math.max(newStreak, task.best_streak || 0)
        updateData.last_completed = today
        updateData.completed = false // Habits reset daily, don't stay completed
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (error) throw error

      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, ...updateData } : t
      ))
    } catch (err) {
      console.error('Error updating task:', err)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      setTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (err) {
      console.error('Error deleting task:', err)
    }
  }

  const clearCompleted = async () => {
    const completedIds = tasks.filter(t => t.completed).map(t => t.id)
    if (completedIds.length === 0) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', completedIds)

      if (error) throw error

      setTasks(prev => prev.filter(t => !t.completed))
    } catch (err) {
      console.error('Error clearing completed:', err)
    }
  }

  // Export tasks to ICS file for calendar import
  const exportToCalendar = () => {
    const tasksWithDates = tasks.filter(t => t.due_date && !t.completed)
    if (tasksWithDates.length === 0) return

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//KingLive//Tasks//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...tasksWithDates.flatMap(task => {
        const dueDate = new Date(task.due_date!)
        const dateStr = dueDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        const endDate = new Date(dueDate)
        endDate.setHours(endDate.getHours() + 1)
        const endStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

        return [
          'BEGIN:VEVENT',
          `UID:${task.id}@kingslive`,
          `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
          `DTSTART:${dateStr}`,
          `DTEND:${endStr}`,
          `SUMMARY:${task.title}`,
          `DESCRIPTION:Priority: ${task.priority}`,
          'END:VEVENT'
        ]
      }),
      'END:VCALENDAR'
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tasks.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredTasks = tasks.filter(task => {
    if (activeTab === "all") return !task.is_habit
    if (activeTab === "active") return !task.completed && !task.is_habit
    if (activeTab === "completed") return task.completed && !task.is_habit
    if (activeTab === "high") return task.priority === "high" && !task.completed && !task.is_habit
    if (activeTab === "habits") return task.is_habit
    return true
  })

  // Check if habit was completed today
  const isHabitCompletedToday = (task: Task) => {
    if (!task.last_completed) return false
    const today = new Date().toISOString().split('T')[0]
    return task.last_completed === today
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500"
      case "medium": return "bg-yellow-500"
      case "low": return "bg-green-500"
      default: return "bg-blue-500"
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-100 dark:bg-red-900/30"
      case "medium": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30"
      case "low": return "text-green-600 bg-green-100 dark:bg-green-900/30"
      default: return "text-blue-600 bg-blue-100"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow"
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const activeTasks = tasks.filter(t => !t.completed && !t.is_habit).length
  const completedTasks = tasks.filter(t => t.completed && !t.is_habit).length
  const highPriorityTasks = tasks.filter(t => t.priority === "high" && !t.completed && !t.is_habit).length
  const habits = tasks.filter(t => t.is_habit)
  const habitsCompletedToday = habits.filter(t => isHabitCompletedToday(t)).length

  // Calendar helpers
  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (number | null)[] = []
    for (let i = 0; i < startingDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }

  const getTasksForDate = (day: number) => {
    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return tasks.filter(t => t.due_date === dateStr && !t.is_habit)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() &&
      calendarMonth.getMonth() === today.getMonth() &&
      calendarMonth.getFullYear() === today.getFullYear()
  }

  const prevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))
  }

  return (
    <Card className="w-full max-w-full overflow-x-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>
              {highPriorityTasks > 0 && (
                <span className="text-red-500">{highPriorityTasks} high priority • </span>
              )}
              {activeTasks} active • {completedTasks} done
              {habits.length > 0 && (
                <span className="text-purple-500"> • {habitsCompletedToday}/{habits.length} habits</span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant={showCalendar ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowCalendar(!showCalendar)}
              title="Calendar View"
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchTasks} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar View */}
        {showCalendar && (
          <div className="mb-4 p-3 rounded-lg border bg-muted/20">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="sm" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium text-sm">
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <Button variant="ghost" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-[10px] text-muted-foreground font-medium py-1">
                  {day}
                </div>
              ))}
              {getCalendarDays().map((day, i) => {
                const dayTasks = day ? getTasksForDate(day) : []
                const hasHighPriority = dayTasks.some(t => t.priority === 'high')
                const hasTasks = dayTasks.length > 0

                return (
                  <div
                    key={i}
                    className={`relative h-8 flex items-center justify-center text-xs rounded-md transition-colors ${day === null ? '' :
                        isToday(day) ? 'bg-primary text-primary-foreground font-bold' :
                          hasTasks ? 'bg-muted hover:bg-muted/80 cursor-pointer' : 'hover:bg-muted/50'
                      }`}
                    title={day && hasTasks ? dayTasks.map(t => t.title).join(', ') : undefined}
                  >
                    {day}
                    {hasTasks && (
                      <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${hasHighPriority ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-3 pt-2 border-t">
              <p className="text-[10px] text-muted-foreground mb-1">Upcoming:</p>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {tasks
                  .filter(t => t.due_date && !t.completed && !t.is_habit)
                  .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                  .slice(0, 3)
                  .map(task => (
                    <div key={task.id} className="flex items-center gap-2 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority)}`} />
                      <span className="truncate flex-1">{task.title}</span>
                      <span className="text-muted-foreground">{formatDate(task.due_date)}</span>
                    </div>
                  ))
                }
                {tasks.filter(t => t.due_date && !t.completed && !t.is_habit).length === 0 && (
                  <p className="text-xs text-muted-foreground">No upcoming tasks</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add task button or form */}
        {!showAddForm ? (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            className="w-full mb-4 border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task or Habit
          </Button>
        ) : (
          <div className="mb-4 p-4 rounded-lg border bg-muted/30 space-y-3">
            {/* Title */}
            <Input
              placeholder="What do you want to accomplish?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="text-base"
              autoFocus
            />

            {/* Description (optional) */}
            <Input
              placeholder="Add details (optional)"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className="text-sm"
            />

            {/* Task Type Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!newTaskIsHabit ? "default" : "outline"}
                size="sm"
                onClick={() => setNewTaskIsHabit(false)}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                One-time Task
              </Button>
              <Button
                type="button"
                variant={newTaskIsHabit ? "default" : "outline"}
                size="sm"
                onClick={() => setNewTaskIsHabit(true)}
                className="flex-1"
              >
                <Repeat className="h-4 w-4 mr-1" />
                Habit
              </Button>
            </div>

            {/* Habit frequency */}
            {newTaskIsHabit && (
              <Select value={newTaskFrequency} onValueChange={(v: "daily" | "weekly" | "weekdays") => setNewTaskFrequency(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="How often?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekdays">Weekdays only</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Priority and Due Date (for tasks) */}
            {!newTaskIsHabit && (
              <div className="flex gap-2">
                <Select value={newTaskPriority} onValueChange={(v: "high" | "medium" | "low") => setNewTaskPriority(v)}>
                  <SelectTrigger className="w-[120px]">
                    <Flag className={`h-3 w-3 mr-1 ${getPriorityColor(newTaskPriority)} rounded-full`} />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                      <Calendar className="h-4 w-4 mr-2" />
                      {newTaskDueDate ? new Date(newTaskDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Due date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="start">
                    <div className="space-y-2">
                      <Input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => {
                          setNewTaskDueDate(new Date().toISOString().split('T')[0])
                        }}>Today</Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          const tomorrow = new Date()
                          tomorrow.setDate(tomorrow.getDate() + 1)
                          setNewTaskDueDate(tomorrow.toISOString().split('T')[0])
                        }}>Tomorrow</Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          const nextWeek = new Date()
                          nextWeek.setDate(nextWeek.getDate() + 7)
                          setNewTaskDueDate(nextWeek.toISOString().split('T')[0])
                        }}>+7 days</Button>
                      </div>
                      {newTaskDueDate && (
                        <Button size="sm" variant="ghost" className="w-full" onClick={() => setNewTaskDueDate("")}>
                          Clear date
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false)
                  setNewTaskTitle("")
                  setNewTaskDescription("")
                  setNewTaskIsHabit(false)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={addTask}
                size="sm"
                disabled={isSaving || !newTaskTitle.trim()}
                className="flex-1"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                {newTaskIsHabit ? 'Add Habit' : 'Add Task'}
              </Button>
            </div>
          </div>
        )}

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2 mb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:mb-4 no-scrollbar">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-5 h-auto p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="all" className="flex-1 px-3 py-1.5 text-xs sm:text-sm">Tasks</TabsTrigger>
              <TabsTrigger value="habits" className="flex-1 px-3 py-1.5 text-xs sm:text-sm text-purple-600">
                <Repeat className="h-3 w-3 mr-1 inline" />
                Habits
              </TabsTrigger>
              <TabsTrigger value="active" className="flex-1 px-3 py-1.5 text-xs sm:text-sm">Active</TabsTrigger>
              <TabsTrigger value="high" className="flex-1 px-3 py-1.5 text-xs sm:text-sm text-red-500">
                <span className="mr-1">🔥</span> High
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1 px-3 py-1.5 text-xs sm:text-sm">Done</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">
                  {activeTab === "completed" ? "No completed tasks yet" :
                    activeTab === "high" ? "No high priority tasks 🎉" :
                      activeTab === "habits" ? "No habits yet. Build your routine!" :
                        "No tasks yet. Add one above!"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-center p-3 rounded-lg border transition-all ${task.is_habit
                        ? isHabitCompletedToday(task)
                          ? "bg-purple-50/50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                          : "bg-purple-50/30 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30"
                        : task.completed
                          ? "bg-muted/30 border-muted"
                          : task.priority === "high"
                            ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30"
                            : "bg-card hover:bg-accent/5"
                      }`}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className={`h-6 w-6 rounded-full mr-3 shrink-0 ${task.is_habit
                          ? isHabitCompletedToday(task)
                            ? "bg-purple-500 text-white border-purple-500"
                            : "border-purple-300 hover:bg-purple-100"
                          : task.completed
                            ? "bg-primary text-primary-foreground border-primary"
                            : ""
                        }`}
                      onClick={() => toggleTaskCompletion(task.id)}
                    >
                      {(task.completed || (task.is_habit && isHabitCompletedToday(task))) && <Check className="h-3 w-3" />}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${task.completed && !task.is_habit ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.is_habit ? (
                          <>
                            <span className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                              <Repeat className="h-3 w-3" />
                              {task.frequency}
                            </span>
                            {(task.streak || 0) > 0 && (
                              <span className="text-xs text-orange-500 flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                {task.streak} day streak
                              </span>
                            )}
                          </>
                        ) : task.due_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    {!task.is_habit && (
                      <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTask(task.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {completedTasks > 0 && (
          <div className="flex justify-end mt-4">
            <Button variant="ghost" size="sm" onClick={clearCompleted} className="text-xs text-muted-foreground">
              Clear completed ({completedTasks})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
