"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { 
  ChevronLeft, ChevronRight, Download, Plus, Calendar,
  Check, Flag, Flame, Repeat, Clock, RefreshCw, X, Loader2,
  ListTodo, CalendarDays, AlertCircle, Trash2
} from "lucide-react"

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: "high" | "medium" | "low"
  due_date?: string
  is_habit?: boolean
  frequency?: string
  streak?: number
  best_streak?: number
}

export function CalendarView() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  
  // Task creation state
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskIsHabit, setNewTaskIsHabit] = useState(false)
  const [newTaskFrequency, setNewTaskFrequency] = useState<'daily' | 'weekly' | 'weekdays'>('daily')
  const [isSaving, setIsSaving] = useState(false)

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true })

      if (error) throw error
      setTasks(data || [])
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

  // Add new task
  const addTask = async () => {
    if (!newTaskTitle.trim()) return
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

      setTasks(prev => [...prev, data].sort((a, b) => {
        if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        if (a.due_date) return -1
        if (b.due_date) return 1
        return 0
      }))

      // Reset form
      setNewTaskTitle('')
      setNewTaskDescription('')
      setNewTaskPriority('medium')
      setNewTaskDueDate('')
      setNewTaskIsHabit(false)
      setNewTaskFrequency('daily')
      setShowAddTask(false)
    } catch (err) {
      console.error('Error adding task:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle task completion
  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId)

      if (error) throw error

      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ))
    } catch (err) {
      console.error('Error toggling task:', err)
    }
  }

  // Delete task
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

  // Calendar helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentDate(new Date())

  const getDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  // Normalize date to YYYY-MM-DD format (handles timestamps like "2025-12-23 00:00:00+00")
  const normalizeDate = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null
    // Handle both "YYYY-MM-DD" and "YYYY-MM-DD HH:MM:SS+00" formats
    return dateStr.split(' ')[0].split('T')[0]
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const getTasksForDate = (day: number) => {
    const dateStr = getDateString(day)
    return tasks.filter(t => normalizeDate(t.due_date) === dateStr)
  }

  // Filter helpers for list view
  const isUpcoming = (task: Task) => {
    const taskDate = normalizeDate(task.due_date)
    return taskDate && !task.completed && taskDate >= todayStr
  }

  const isDueToday = (task: Task) => {
    const taskDate = normalizeDate(task.due_date)
    return taskDate === todayStr && !task.completed
  }

  const isOverdue = (task: Task) => {
    const taskDate = normalizeDate(task.due_date)
    return taskDate && !task.completed && taskDate < todayStr
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  const isPast = (day: number) => {
    const date = new Date(year, month, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500"
      case "medium": return "bg-yellow-500"
      case "low": return "bg-green-500"
      default: return "bg-blue-500"
    }
  }

  // Export to ICS
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
    a.download = 'kingslive-tasks.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Generate calendar grid
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null)
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i)

  // Stats
  const totalTasks = tasks.filter(t => !t.is_habit).length
  const completedTasks = tasks.filter(t => t.completed && !t.is_habit).length
  const upcomingTasks = tasks.filter(t => t.due_date && !t.completed && !t.is_habit).length

  // Selected date tasks
  const selectedDateTasks = selectedDate 
    ? tasks.filter(t => normalizeDate(t.due_date) === selectedDate)
    : []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Task Calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalTasks} tasks • {completedTasks} completed • {upcomingTasks} upcoming
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button 
              variant={viewMode === 'calendar' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-none"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-none"
              onClick={() => setViewMode('list')}
            >
              <ListTodo className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTasks} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCalendar}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAddTask(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Task
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Task Type Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!newTaskIsHabit ? "default" : "outline"}
                size="sm"
                onClick={() => setNewTaskIsHabit(false)}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                One-time Task
              </Button>
              <Button
                type="button"
                variant={newTaskIsHabit ? "default" : "outline"}
                size="sm"
                onClick={() => setNewTaskIsHabit(true)}
                className="flex-1"
              >
                <Repeat className="h-4 w-4 mr-2" />
                Habit
              </Button>
            </div>

            {/* Title */}
            <Input
              placeholder="What do you want to accomplish?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="text-base"
              autoFocus
            />

            {/* Description */}
            <textarea
              placeholder="Add details (optional)"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className="w-full h-20 px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
            />

            {/* Habit frequency */}
            {newTaskIsHabit && (
              <Select value={newTaskFrequency} onValueChange={(v: 'daily' | 'weekly' | 'weekdays') => setNewTaskFrequency(v)}>
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
                <Select value={newTaskPriority} onValueChange={(v: 'high' | 'medium' | 'low') => setNewTaskPriority(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        High Priority
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Low
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="flex-1"
                />
              </div>
            )}

            {/* Quick date buttons */}
            {!newTaskIsHabit && (
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setNewTaskDueDate(new Date().toISOString().split('T')[0])}
                >
                  Today
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const tomorrow = new Date()
                    tomorrow.setDate(tomorrow.getDate() + 1)
                    setNewTaskDueDate(tomorrow.toISOString().split('T')[0])
                  }}
                >
                  Tomorrow
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const nextWeek = new Date()
                    nextWeek.setDate(nextWeek.getDate() + 7)
                    setNewTaskDueDate(nextWeek.toISOString().split('T')[0])
                  }}
                >
                  Next Week
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowAddTask(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={addTask} disabled={isSaving || !newTaskTitle.trim()} className="flex-1">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {newTaskIsHabit ? 'Create Habit' : 'Create Task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-4">
            <Tabs defaultValue="upcoming">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="overdue" className="text-red-500">Overdue</TabsTrigger>
                <TabsTrigger value="completed">Done</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-2">
                {tasks
                  .filter(isUpcoming)
                  .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                  .map(task => (
                    <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} getPriorityColor={getPriorityColor} />
                  ))
                }
                {tasks.filter(isUpcoming).length === 0 && (
                  <EmptyState message="No upcoming tasks" />
                )}
              </TabsContent>

              <TabsContent value="today" className="space-y-2">
                {tasks
                  .filter(isDueToday)
                  .map(task => (
                    <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} getPriorityColor={getPriorityColor} />
                  ))
                }
                {tasks.filter(isDueToday).length === 0 && (
                  <EmptyState message="No tasks due today" />
                )}
              </TabsContent>

              <TabsContent value="overdue" className="space-y-2">
                {tasks
                  .filter(isOverdue)
                  .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                  .map(task => (
                    <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} getPriorityColor={getPriorityColor} isOverdue />
                  ))
                }
                {tasks.filter(isOverdue).length === 0 && (
                  <EmptyState message="No overdue tasks 🎉" />
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-2">
                {tasks
                  .filter(t => t.completed)
                  .slice(0, 10)
                  .map(task => (
                    <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} getPriorityColor={getPriorityColor} />
                  ))
                }
                {tasks.filter(t => t.completed).length === 0 && (
                  <EmptyState message="No completed tasks yet" />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Calendar */}
          <Card className="lg:col-span-3">
            <CardContent className="p-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold ml-2">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                </div>
                <Button variant="ghost" size="sm" onClick={goToToday}>
                  Today
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="h-24 bg-muted/20 rounded-lg" />
                  }

                  const dayTasks = getTasksForDate(day)
                  const hasHighPriority = dayTasks.some(t => t.priority === 'high' && !t.completed)
                  const hasMediumPriority = dayTasks.some(t => t.priority === 'medium' && !t.completed)
                  const hasLowPriority = dayTasks.some(t => t.priority === 'low' && !t.completed)
                  const hasHabits = dayTasks.some(t => t.is_habit)
                  const allCompleted = dayTasks.length > 0 && dayTasks.every(t => t.completed)
                  const dateStr = getDateString(day)
                  const isSelected = selectedDate === dateStr
                  const hasTasks = dayTasks.length > 0

                  return (
                    <Tooltip key={day}>
                      <TooltipTrigger asChild>
                        <div
                          className={`h-24 p-2 rounded-lg border cursor-pointer transition-all relative ${
                            isToday(day) 
                              ? 'bg-primary/10 border-primary ring-2 ring-primary/20' 
                              : isSelected
                                ? 'bg-accent border-accent-foreground/20'
                                : isPast(day) 
                                  ? 'bg-muted/30 border-transparent' 
                                  : 'bg-card hover:bg-accent/50 border-border'
                          }`}
                          onClick={() => setSelectedDate(dateStr)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-1">
                              <span className={`text-sm font-medium ${
                                isToday(day) ? 'text-primary' : isPast(day) ? 'text-muted-foreground' : ''
                              }`}>
                                {day}
                              </span>
                              {/* Prominent dot indicator */}
                              {hasTasks && !allCompleted && (
                                <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                                  hasHighPriority ? 'bg-red-500' : 
                                  hasMediumPriority ? 'bg-yellow-500' : 
                                  hasLowPriority ? 'bg-green-500' : 
                                  'bg-purple-500'
                                }`} />
                              )}
                            </div>
                            {dayTasks.length > 0 && (
                              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                                {dayTasks.length}
                              </Badge>
                            )}
                          </div>

                          {/* Task preview (first 2) */}
                          <div className="mt-1 space-y-0.5 overflow-hidden">
                            {dayTasks.slice(0, 2).map(task => (
                              <div 
                                key={task.id} 
                                className={`text-[10px] truncate px-1 py-0.5 rounded flex items-center gap-1 ${
                                  task.completed 
                                    ? 'bg-muted text-muted-foreground line-through' 
                                    : task.is_habit
                                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                      : task.priority === 'high'
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                        : task.priority === 'medium'
                                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  task.is_habit ? 'bg-purple-500' : getPriorityColor(task.priority)
                                }`} />
                                <span className="truncate">{task.title}</span>
                              </div>
                            ))}
                            {dayTasks.length > 2 && (
                              <div className="text-[10px] text-muted-foreground pl-1">
                                +{dayTasks.length - 2} more
                              </div>
                            )}
                          </div>

                          {/* Completed checkmark */}
                          {allCompleted && dayTasks.length > 0 && (
                            <div className="absolute bottom-1 right-1">
                              <Check className="w-4 h-4 text-green-500" />
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      {dayTasks.length > 0 && (
                        <TooltipContent side="right" className="max-w-[280px] p-3">
                          <div className="space-y-2">
                            <p className="font-semibold text-sm border-b pb-1">
                              {new Date(year, month, day).toLocaleDateString('en-US', { 
                                weekday: 'long', month: 'short', day: 'numeric' 
                              })}
                            </p>
                            {dayTasks.map(task => (
                              <div key={task.id} className="flex items-start gap-2 text-xs">
                                <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                                  task.is_habit ? 'bg-purple-500' : getPriorityColor(task.priority)
                                }`} />
                                <div>
                                  <span className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {task.title}
                                  </span>
                                  {task.description && (
                                    <p className="text-muted-foreground text-[10px] mt-0.5">{task.description}</p>
                                  )}
                                </div>
                                {task.is_habit && <Repeat className="h-3 w-3 text-purple-500 shrink-0" />}
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  High
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  Medium
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  Low
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  Habit
                </div>
              </div>
            </CardContent>
          </Card>

        {/* Sidebar - Selected Date Details */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">
              {selectedDate 
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'long', month: 'long', day: 'numeric' 
                  })
                : 'Select a date'
              }
            </h3>

            {selectedDate ? (
              selectedDateTasks.length > 0 ? (
                <div className="space-y-2">
                  {selectedDateTasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`p-3 rounded-lg border ${
                        task.completed 
                          ? 'bg-muted/30' 
                          : task.is_habit
                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                            : task.priority === 'high'
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : 'bg-card'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${
                          task.is_habit ? 'bg-purple-500' : getPriorityColor(task.priority)
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {task.is_habit ? (
                              <Badge variant="secondary" className="text-purple-600 bg-purple-100 dark:bg-purple-900/30">
                                <Repeat className="h-3 w-3 mr-1" />
                                {task.frequency}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className={`text-xs ${
                                task.priority === 'high' ? 'text-red-600 bg-red-100 dark:bg-red-900/30' :
                                task.priority === 'medium' ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' :
                                'text-green-600 bg-green-100 dark:bg-green-900/30'
                              }`}>
                                <Flag className="h-3 w-3 mr-1" />
                                {task.priority}
                              </Badge>
                            )}
                            {task.completed && (
                              <Badge variant="secondary" className="text-green-600 bg-green-100 dark:bg-green-900/30">
                                <Check className="h-3 w-3 mr-1" />
                                Done
                              </Badge>
                            )}
                            {task.streak && task.streak > 0 && (
                              <Badge variant="secondary" className="text-orange-600 bg-orange-100 dark:bg-orange-900/30">
                                <Flame className="h-3 w-3 mr-1" />
                                {task.streak}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No tasks for this day</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Click a date to see tasks</p>
              </div>
            )}

            {/* Upcoming tasks */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium text-sm mb-2">Upcoming</h4>
              <div className="space-y-2">
                {tasks
                  .filter(t => t.due_date && !t.completed && !t.is_habit)
                  .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                  .slice(0, 5)
                  .map(task => (
                    <div key={task.id} className="flex items-center gap-2 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority)}`} />
                      <span className="truncate flex-1">{task.title}</span>
                      <span className="text-muted-foreground shrink-0">
                        {new Date(task.due_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))
                }
                {tasks.filter(t => t.due_date && !t.completed && !t.is_habit).length === 0 && (
                  <p className="text-xs text-muted-foreground">No upcoming tasks</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  )
}

// Helper components
function TaskItem({ 
  task, 
  onToggle, 
  onDelete, 
  getPriorityColor,
  isOverdue 
}: { 
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  getPriorityColor: (priority: string) => string
  isOverdue?: boolean
}) {
  return (
    <div className={`p-3 rounded-lg border flex items-center gap-3 group ${
      task.completed 
        ? 'bg-muted/30' 
        : isOverdue
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : task.priority === 'high'
            ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
            : 'bg-card'
    }`}>
      <Button
        variant="outline"
        size="icon"
        className={`h-6 w-6 rounded-full shrink-0 ${
          task.completed ? 'bg-green-500 text-white border-green-500' : ''
        }`}
        onClick={() => onToggle(task.id)}
      >
        {task.completed && <Check className="h-3 w-3" />}
      </Button>
      
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
          <span className="text-xs text-muted-foreground capitalize">{task.priority}</span>
          {task.due_date && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={() => onDelete(task.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
