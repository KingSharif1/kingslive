"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: "meeting" | "deadline" | "reminder"
}

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: "1",
      title: "Team Meeting",
      date: new Date(2023, currentDate.getMonth(), 15, 10, 0),
      type: "meeting"
    },
    {
      id: "2",
      title: "Article Deadline",
      date: new Date(2023, currentDate.getMonth(), 20, 23, 59),
      type: "deadline"
    },
    {
      id: "3",
      title: "Review Draft",
      date: new Date(2023, currentDate.getMonth(), 10, 14, 0),
      type: "reminder"
    }
  ])

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay()

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    )
  }

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    )
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getEventsForDay = (day: number) => {
    return events.filter(event => 
      event.date.getDate() === day && 
      event.date.getMonth() === currentDate.getMonth() &&
      event.date.getFullYear() === currentDate.getFullYear()
    )
  }

  const renderCalendarDays = () => {
    const days = []
    const today = new Date()
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 p-1 border border-border/50"></div>
      )
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = 
        day === today.getDate() && 
        currentDate.getMonth() === today.getMonth() && 
        currentDate.getFullYear() === today.getFullYear()
      
      const dayEvents = getEventsForDay(day)
      
      days.push(
        <div 
          key={day} 
          className={`h-24 p-1 border border-border/50 overflow-hidden ${
            isToday ? "bg-primary/10" : ""
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>
              {day}
            </span>
          </div>
          <div className="mt-1">
            {dayEvents.map(event => (
              <div 
                key={event.id}
                className={`text-xs p-1 mb-1 rounded truncate ${
                  event.type === "meeting" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300" :
                  event.type === "deadline" ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" :
                  "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                }`}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      )
    }
    
    return days
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex justify-between items-center">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-0">
          {dayNames.map(day => (
            <div key={day} className="text-center font-medium text-sm py-2">
              {day}
            </div>
          ))}
          {renderCalendarDays()}
        </div>
        <div className="mt-4">
          <h3 className="font-medium text-sm mb-2">Upcoming Events</h3>
          <div className="space-y-2">
            {events
              .filter(event => event.date > new Date())
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .slice(0, 3)
              .map(event => (
                <div 
                  key={event.id} 
                  className="flex items-center p-2 rounded-md bg-muted"
                >
                  <div 
                    className={`w-3 h-3 rounded-full mr-2 ${
                      event.type === "meeting" ? "bg-blue-500" :
                      event.type === "deadline" ? "bg-red-500" :
                      "bg-green-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.date.toLocaleDateString()} at {event.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
