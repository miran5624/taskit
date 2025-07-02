"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { fetchTasks, fetchTeamMembers, fetchCurrentUser, updateTask, logout } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Plus, User, LogOut, Calendar, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CreateTaskModal } from "@/components/create-task-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api"

export default function KanbanPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { user, tasks, loading, isAuthenticated } = useAppSelector((state) => state.app)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/signin")
      return
    }

    if (!isAuthenticated) {
      dispatch(fetchCurrentUser())
    }

    dispatch(fetchTasks())
    ;(async () => {
      try {
        const data = await apiClient.getMyTeams()
        if (data.teams && data.teams.length > 0) {
          const members = await apiClient.getTeamMembersById(data.teams[0].id)
          setTeamMembers(members.members)
        } else {
          setTeamMembers([])
        }
      } catch {
        setTeamMembers([])
      }
    })()
  }, [dispatch, isAuthenticated, router])

  const handleLogout = () => {
    dispatch(logout())
    router.push("/")
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()

    if (!draggedTask) return

    const task = tasks.find((t) => t.id === draggedTask)
    if (!task || task.status === newStatus) return

    try {
      await dispatch(
        updateTask({
          taskId: draggedTask,
          updates: { status: newStatus },
        }),
      ).unwrap()
    } catch (error) {
      console.error("Failed to update task status:", error)
    }

    setDraggedTask(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-500"
      case "Medium":
        return "bg-yellow-500"
      case "Low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isDeadlineApproaching = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays >= 0
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const todoTasks = tasks.filter((task) => task.status === "To Do")
  const inProgressTasks = tasks.filter((task) => task.status === "In Progress")
  const doneTasks = tasks.filter((task) => task.status === "Done")

  const columns = [
    { title: "To Do", status: "To Do", tasks: todoTasks, color: "border-gray-500" },
    { title: "In Progress", status: "In Progress", tasks: inProgressTasks, color: "border-blue-500" },
    { title: "Done", status: "Done", tasks: doneTasks, color: "border-green-500" },
  ]

  return (
    <div className="min-h-screen bg-[#171717] text-white">
      {/* Navigation */}
      <nav className="bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#3ecf8e] rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#171717]" />
            </div>
            <span className="text-xl font-bold">TaskIt</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-white hover:text-[#3ecf8e]">
                Dashboard
              </Button>
            </Link>
            <Link href="/kanban">
              <Button variant="ghost" className="text-[#3ecf8e] hover:text-[#3ecf8e]">
                Manage Tasks
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:text-[#3ecf8e]">
                  <User className="w-4 h-4 mr-2" />
                  {user?.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                <DropdownMenuItem onClick={handleLogout} className="text-white hover:bg-gray-700">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 lg:px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage Tasks</h1>
            <p className="text-gray-400 mt-2">Drag and drop tasks to update their status</p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#171717]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        </div>

        {/* Kanban Columns */}
        <div className="grid md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <div
              key={column.status}
              className={`bg-gray-800/50 rounded-lg border-2 ${column.color} min-h-[600px]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white flex items-center justify-between">
                  {column.title}
                  <Badge variant="secondary" className="bg-gray-700 text-white">
                    {column.tasks.length}
                  </Badge>
                </h2>
              </div>

              <div className="p-4 space-y-4">
                {column.tasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="bg-gray-700/50 border-gray-600 cursor-move hover:bg-gray-700/70 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-white text-sm">{task.title}</h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-6 w-6 p-0">
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-gray-800 border-gray-700">
                            <DropdownMenuItem className="text-white hover:bg-gray-700">Edit Task</DropdownMenuItem>
                            {task.createdBy === user?.id && (
                              <DropdownMenuItem className="text-red-400 hover:bg-gray-700">
                                Delete Task
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {task.description && (
                        <p className="text-gray-300 text-xs mb-3 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex flex-wrap gap-1 mb-3">
                        <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                          {task.priority}
                        </Badge>
                        {isDeadlineApproaching(task.dueDate) && (
                          <Badge className="bg-orange-500 text-white text-xs">Due Soon</Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-xs text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(task.dueDate)}
                        </div>
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {task.assignees && task.assignees.length > 0
                            ? task.assignees.map(a => a.email).join(", ")
                            : "Unassigned"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {column.tasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No tasks in {column.title.toLowerCase()}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-400">Loading tasks...</div>
          </div>
        )}
      </div>

      <CreateTaskModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} teamMembers={teamMembers || []} />
    </div>
  )
}
