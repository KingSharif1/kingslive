"use client"

import { useState } from "react"
import { Check, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Task {
  id: string
  title: string
  completed: boolean
  priority: "high" | "medium" | "low"
  dueDate?: Date
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Write new blog post",
      completed: false,
      priority: "high",
      dueDate: new Date(Date.now() + 86400000) // Tomorrow
    },
    {
      id: "2",
      title: "Review comments",
      completed: false,
      priority: "medium",
      dueDate: new Date(Date.now() + 172800000) // Day after tomorrow
    },
    {
      id: "3",
      title: "Update portfolio",
      completed: true,
      priority: "low"
    }
  ])
  
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  
  const addTask = () => {
    if (newTaskTitle.trim() === "") return
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
      priority: "medium"
    }
    
    setTasks([...tasks, newTask])
    setNewTaskTitle("")
  }
  
  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ))
  }
  
  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }
  
  const filteredTasks = tasks.filter(task => {
    if (activeTab === "all") return true
    if (activeTab === "active") return !task.completed
    if (activeTab === "completed") return task.completed
    return true
  })
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-blue-500"
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex mb-4">
          <Input
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask()
            }}
            className="flex-1 mr-2"
          />
          <Button onClick={addTask} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No tasks found
                </div>
              ) : (
                filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-center p-3 rounded-md border ${
                      task.completed ? "bg-muted/50" : "bg-card"
                    }`}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className={`h-6 w-6 rounded-full mr-3 ${
                        task.completed ? "bg-primary text-primary-foreground" : ""
                      }`}
                      onClick={() => toggleTaskCompletion(task.id)}
                    >
                      {task.completed && <Check className="h-3 w-3" />}
                    </Button>
                    <div className="flex-1">
                      <p className={`text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Due: {task.dueDate.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className={`w-2 h-2 rounded-full mr-2 ${getPriorityColor(task.priority)}`} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTask(task.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between text-xs text-muted-foreground mt-4">
          <span>{tasks.filter(t => !t.completed).length} tasks left</span>
          <span>{tasks.filter(t => t.completed).length} completed</span>
        </div>
      </CardContent>
    </Card>
  )
}
