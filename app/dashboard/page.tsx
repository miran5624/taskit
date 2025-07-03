"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { fetchTasks, fetchTeamMembers, fetchCurrentUser, logout, createTask, updateTask, deleteTask } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Plus, Filter, Calendar, User, LogOut, MoreHorizontal, Bell, MessageCircle, Send } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CreateTaskModal } from "@/components/create-task-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { apiClient } from "@/lib/api"
import { Bar } from 'react-chartjs-2'
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { user, tasks, loading, isAuthenticated } = useAppSelector((state) => state.app)
  const [activeFilter, setActiveFilter] = useState<string>("todo")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignTaskId, setAssignTaskId] = useState<string | null>(null)
  const [assignEmail, setAssignEmail] = useState("")
  const [assignError, setAssignError] = useState("")
  const [assignLoading, setAssignLoading] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifRead, setNotifRead] = useState(false)
  const now = new Date()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editTaskData, setEditTaskData] = useState<any>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [editLoading, setEditLoading] = useState(false)
  const [chatListOpen, setChatListOpen] = useState(false)
  const [userChats, setUserChats] = useState<any[]>([])
  const [openChatTaskId, setOpenChatTaskId] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatId, setChatId] = useState<number | null>(null)
  const [chatInput, setChatInput] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [chatListLoading, setChatListLoading] = useState(false)
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [teamEmails, setTeamEmails] = useState<string[]>([])
  const [teamEmailInput, setTeamEmailInput] = useState("")
  const [teamCreateError, setTeamCreateError] = useState("")
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [teamId, setTeamId] = useState<number|null>(null)
  const teamInputRef = useRef<HTMLInputElement>(null)
  const [assignSelectedEmails, setAssignSelectedEmails] = useState<string[]>([])
  const [isManageTeamModalOpen, setIsManageTeamModalOpen] = useState(false)
  const [manageTeamError, setManageTeamError] = useState("")
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [teamIdOwner, setTeamIdOwner] = useState<number|null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

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
    // Fetch user's teams and set teamId/teamIdOwner, then fetch team members
    ;(async () => {
      try {
        const data = await apiClient.getMyTeams()
        if (data.teams && data.teams.length > 0) {
          setTeamId(data.teams[0].id)
          setTeamIdOwner(data.teams[0].ownerId)
          const members = await apiClient.getTeamMembersById(data.teams[0].id)
          setTeamMembers(members.members)
        } else {
          setTeamId(null)
          setTeamIdOwner(null)
          setTeamMembers([])
        }
      } catch {
        setTeamId(null)
        setTeamIdOwner(null)
        setTeamMembers([])
      }
    })()
  }, [dispatch, isAuthenticated, router])

  useEffect(() => {
    const fetchChatAndMessages = async () => {
      if (!openChatTaskId) return
      setChatLoading(true)
      try {
        const token = localStorage.getItem("authToken")
        const apiBase = process.env.NEXT_PUBLIC_API_URL
        const chatRes = await fetch(`${apiBase}/chat/task/${openChatTaskId}`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : undefined,
        })
        const chatData = await chatRes.json()
        setChatId(chatData.chat.id)
        const msgRes = await fetch(`${apiBase}/chat/${chatData.chat.id}/messages`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : undefined,
        })
        const msgData = await msgRes.json()
        setChatMessages(msgData.messages)
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
      } catch (err) {
        setChatMessages([])
        setChatId(null)
      } finally {
        setChatLoading(false)
      }
    }
    fetchChatAndMessages()
  }, [openChatTaskId])

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
    const filterParam = filter === "all" ? undefined : filter
    dispatch(fetchTasks(filterParam))
  }

  const handleLogout = () => {
    dispatch(logout())
    router.push("/")
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "To Do":
        return "bg-gray-500"
      case "In Progress":
        return "bg-blue-500"
      case "Done":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}, ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const isDeadlineApproaching = (dueDate: string, status: string) => {
    if (status === "Done") return false;
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    return diffDays <= 3 && diffDays > 0
  }

  const isDeadlineCrossed = (dueDate: string, status: string) => {
    if (status === "Done") return false;
    return new Date(dueDate) < new Date();
  }

  const handleOpenAssignModal = (taskId: string) => {
    setAssignTaskId(taskId)
    setAssignEmail("")
    setAssignSelectedEmails([])
    setAssignError("")
    setAssignModalOpen(true)
  }

  const handleAssign = async () => {
    if (!assignSelectedEmails.length) {
      setAssignError("Please select at least one member.")
      return
    }
    setAssignLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${assignTaskId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ emails: assignSelectedEmails }),
      })
      if (!res.ok) {
        const data = await res.json()
        setAssignError(data.message || "Failed to assign task")
      } else {
        setAssignModalOpen(false)
        setAssignError("")
        setAssignSelectedEmails([])
        setAssignEmail("")
        dispatch(fetchTasks())
      }
    } catch (err) {
      setAssignError("Server error assigning task")
    } finally {
      setAssignLoading(false)
    }
  }

  const handleEditTask = (task: any) => {
    setEditTaskData({
      ...task,
      assigneeIds: task.assignees ? task.assignees.map((a: any) => a.id) : [],
    })
    setEditModalOpen(true)
  }

  const handleDeleteTask = (taskId: string) => {
    setDeleteTaskId(taskId)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteTask = async () => {
    if (!deleteTaskId) return
    await dispatch(deleteTask(deleteTaskId))
    setDeleteConfirmOpen(false)
    setDeleteTaskId(null)
    dispatch(fetchTasks())
  }

  const validateEditForm = () => {
    const newErrors: Record<string, string> = {}
    if (!editTaskData.title.trim()) newErrors.title = "Title is required"
    if (!editTaskData.dueDate) newErrors.dueDate = "Due date is required"
    if (!editTaskData.priority) newErrors.priority = "Priority is required"
    if (!editTaskData.assigneeIds || editTaskData.assigneeIds.length === 0) newErrors.assigneeIds = "Assignees are required"
    setEditErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateEditForm()) return
    setEditLoading(true)
    try {
      await dispatch(updateTask({ taskId: editTaskData.id, updates: {
        title: editTaskData.title.trim(),
        description: editTaskData.description.trim(),
        dueDate: editTaskData.dueDate,
        priority: editTaskData.priority,
        assigneeIds: editTaskData.assigneeIds,
      }})).unwrap()
      setEditModalOpen(false)
      setEditTaskData(null)
      setEditErrors({})
      dispatch(fetchTasks())
    } catch (error) {
      setEditErrors({ general: "Failed to update task" })
    } finally {
      setEditLoading(false)
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!chatId || !chatInput.trim()) return
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: chatInput }),
      })
      if (res.ok) {
        const data = await res.json()
        setChatMessages((prev) => [...prev, data.message])
        setChatInput("")
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
      }
    } catch {}
  }

  const fetchUserChats = useCallback(async () => {
    if (!user) return
    setChatListLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/chats`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : undefined,
      })
      if (res.ok) {
        const data = await res.json()
        setUserChats(data.chats)
      } else {
        setUserChats([])
      }
    } catch {
      setUserChats([])
    } finally {
      setChatListLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (chatListOpen) fetchUserChats()
  }, [chatListOpen, fetchUserChats])

  const fetchTeamMembersForTeam = async (teamId: number) => {
    const token = localStorage.getItem("authToken")
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/teams/${teamId}/members`, {
      headers: token ? { "Authorization": `Bearer ${token}` } : undefined,
    })
    if (res.ok) {
      const data = await res.json()
      setTeamMembers(data.members)
    }
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setTeamCreateError("")
    if (!teamName.trim()) {
      setTeamCreateError("Team name is required")
      return
    }
    if (teamEmails.length === 0) {
      setTeamCreateError("Add at least one member email")
      return
    }
    const token = localStorage.getItem("authToken")
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ name: teamName, members: teamEmails }),
    })
    if (res.ok) {
      const data = await res.json()
      setIsTeamModalOpen(false)
      setTeamName("")
      setTeamEmails([])
      setTeamEmailInput("")
      setTeamId(data.teamId ?? null)
      setTeamIdOwner(user?.id ?? null)
      if (data.teamId != null) fetchTeamMembersForTeam(data.teamId)
    } else {
      const data = await res.json()
      setTeamCreateError(data.message || "Failed to create team")
    }
  }

  const handleAddTeamEmail = () => {
    if (teamEmailInput.trim() && !teamEmails.includes(teamEmailInput.trim())) {
      setTeamEmails([...teamEmails, teamEmailInput.trim()])
      setTeamEmailInput("")
      teamInputRef.current?.focus()
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const assignedToMe = tasks.filter((task) => task.assignees.some(a => a.id === user?.id))
  const assignedByMe = tasks.filter((task) => task.createdBy === user?.id)

  const assignedToMeNotifs = tasks.filter(
    (task) => task.assignees.some(a => a.id === user?.id) && task.createdBy !== user?.id
  )
  const completedByMeNotifs = tasks.filter(
    (task) => task.createdBy === user?.id && task.status === "Done"
  )
  const deadlineCrossedNotifs = tasks.filter(
    (task) => isDeadlineCrossed(task.dueDate, task.status)
  )
  const hasUnread = assignedToMeNotifs.length > 0 || completedByMeNotifs.length > 0 || deadlineCrossedNotifs.length > 0

  return (
    <div className="min-h-screen bg-[#171717] text-white">
      {/* Navigation */}
      <nav className="border-b border-[#232323] bg-[#141414]">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:text-[#3ecf8e]">
                  <User className="w-4 h-4 mr-2" />
                  {user?.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#18181b] border border-[#232323] shadow-xl">
                <DropdownMenuItem onClick={handleLogout} className="text-white hover:bg-[#232323] transition-colors">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="relative">
              <Button variant="ghost" className="text-white hover:text-[#3ecf8e]" onClick={() => { setNotifOpen((v) => !v); setNotifRead(true); }}>
                <Bell className="w-5 h-5" />
                {hasUnread && !notifRead && (
                  <span className="absolute top-1 right-1 block w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-[#141414] border-none rounded-2xl shadow-2xl z-50 p-0 overflow-hidden">
                  <div className="p-4 border-b border-[#232323] font-semibold text-white text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#3ecf8e]" /> Notifications
                  </div>
                  <div className="max-h-96 overflow-y-auto flex flex-col gap-3 p-4">
                    {assignedToMeNotifs.length === 0 && completedByMeNotifs.length === 0 && deadlineCrossedNotifs.length === 0 ? (
                      <div className="py-8 text-gray-400 text-center">No notifications</div>
                    ) : (
                      <>
                        {assignedToMeNotifs.map((task) => (
                          <div key={task.id} className="flex items-center gap-3 bg-[#232323] border border-[#3ecf8e] rounded-xl px-4 py-3 text-sm text-[#3ecf8e] shadow">
                            <User className="w-5 h-5 text-[#3ecf8e] flex-shrink-0" />
                            <span><span className="font-bold text-white">Task Assigned:</span> "{task.title}" has been assigned to you.</span>
                          </div>
                        ))}
                        {completedByMeNotifs.map((task) => (
                          <div key={task.id} className="flex items-center gap-3 bg-[#1a2e1a] border border-[#3ecf8e] rounded-xl px-4 py-3 text-sm text-[#3ecf8e] shadow">
                            <CheckCircle className="w-5 h-5 text-[#3ecf8e] flex-shrink-0" />
                            <span><span className="font-bold text-white">Task Completed:</span> "{task.title}" assigned by you is marked as completed.</span>
                          </div>
                        ))}
                        {deadlineCrossedNotifs.map((task) => (
                          <div key={task.id} className="flex items-center gap-3 bg-[#2a181a] border border-[#ff1744] rounded-xl px-4 py-3 text-sm text-[#ff1744] shadow">
                            <span className="flex items-center justify-center bg-[#ff1744] rounded-full w-7 h-7"><Bell className="w-4 h-4 text-white" /></span>
                            <span><span className="font-bold text-white">Deadline Crossed:</span> "{task.title}" has missed its deadline!</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chat List Button */}
            <div className="relative">
              <Button variant="ghost" className="text-white hover:text-[#3ecf8e]" onClick={() => setChatListOpen((v) => !v)}>
                <MessageCircle className="w-5 h-5" />
              </Button>
              {chatListOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#141414] border-none rounded-2xl shadow-2xl z-50 p-0 overflow-hidden">
                  <div className="p-4 border-b border-[#232323] font-semibold text-white">My Chats</div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#232323]">
                    {chatListLoading ? (
                      <div className="p-4 text-gray-400 text-center">Loading chats...</div>
                    ) : userChats.length === 0 ? (
                      <div className="p-4 text-gray-400 text-center">No chats yet</div>
                    ) : (
                      userChats.map((chat) => (
                        <div
                          key={chat.id}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-white cursor-pointer hover:bg-[#232323] transition rounded-xl"
                          onClick={() => {
                            setOpenChatTaskId(chat.taskId.toString());
                            setChatListOpen(false);
                          }}
                        >
                          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#3ecf8e] text-[#171717] font-bold text-lg uppercase">
                            {chat.taskTitle ? chat.taskTitle.charAt(0) : "#"}
                          </span>
                          <span className="truncate font-medium text-white">{chat.taskTitle || `Task #${chat.taskId}`}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {!teamId ? (
              <Button
                onClick={() => setIsTeamModalOpen(true)}
                className="bg-[#3ecf8e] text-[#171717] font-bold px-4 py-2 rounded-full hover:bg-[#3ecf8e]/90 transition"
              >
                Create Team
              </Button>
            ) : (
              <Button
                onClick={() => setIsManageTeamModalOpen(true)}
                className="bg-[#3ecf8e] text-[#171717] font-bold px-4 py-2 rounded-full hover:bg-[#3ecf8e]/90 transition"
              >
                Manage Team
              </Button>
            )}

            <Button
              onClick={() => setIsReportModalOpen(true)}
              className="bg-[#3ecf8e] text-[#171717] font-bold px-4 py-2 rounded-full hover:bg-[#3ecf8e]/90 transition"
            >
              Tasks Report
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 lg:px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-400 mt-2">Welcome back, {user?.email}</p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#171717]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: "todo", label: "To Do" },
            { key: "all", label: "All Tasks" },
            { key: "in-progress", label: "In Progress" },
            { key: "completed", label: "Completed" },
            { key: "deadline-approaching", label: "Deadline Approaching" },
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange(filter.key)}
              className={
                activeFilter === filter.key
                  ? "bg-[#3ecf8e] text-[#171717]"
                  : "border-gray-600 text-white hover:bg-gray-700"
              }
            >
              <Filter className="w-3 h-3 mr-1" />
              {filter.label}
            </Button>
          ))}
          <Link href="/kanban">
            <Button
              size="sm"
              className="bg-[#3ecf8e] text-[#171717] hover:bg-[#3ecf8e]/90 border border-[#3ecf8e]"
            >
              Manage Tasks
            </Button>
          </Link>
        </div>

        {/* Task Sections */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Tasks Assigned to Me */}
          <Card className="bg-[#141414] border border-[#232323]">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="w-5 h-5 mr-2 text-[#3ecf8e]" />
                Tasks Assigned to Me ({assignedToMe.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedToMe.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No tasks assigned to you</p>
              ) : (
                assignedToMe.map((task) => (
                  <div key={task.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#232323]">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{task.title}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem className="text-white hover:bg-gray-700" onClick={() => handleEditTask(task)}>
                            Edit Task
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-white hover:bg-gray-700">Mark Complete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {task.description && <p className="text-gray-300 text-sm mb-3">{task.description}</p>}

                    <div className="flex flex-wrap gap-2 mb-3">
                      {task.status !== "Done" && (
                        <>
                      <Badge className={`${getPriorityColor(task.priority)} text-white`}>{task.priority}</Badge>
                          {isDeadlineApproaching(task.dueDate, task.status) && (
                            <Badge className="bg-orange-500 text-white">Deadline Approaching</Badge>
                          )}
                          {isDeadlineCrossed(task.dueDate, task.status) && (
                            <Badge className="bg-red-500 text-white">Deadline Crossed</Badge>
                          )}
                        </>
                      )}
                      <Badge className={`${getStatusColor(task.status)} text-white`}>{task.status}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Due: {formatDate(task.dueDate)}
                      </div>
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <User className="w-4 h-4 mr-1" />
                        {task.assignees && task.assignees.length > 0
                          ? task.assignees.map(a => a.email).join(", ")
                          : "Unassigned"}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="w-24 bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#171717] flex items-center justify-center"
                        onClick={() => handleOpenAssignModal(task.id)}
                      >
                        Assign
                      </Button>
                      <Button
                        size="sm"
                        className="w-24 bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#171717] flex items-center justify-center"
                        onClick={() => setOpenChatTaskId(task.id)}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Tasks I Have Assigned */}
          <Card className="bg-[#141414] border border-[#232323]">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-[#3ecf8e]" />
                Tasks I Have Assigned ({assignedByMe.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedByMe.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No tasks created by you</p>
              ) : (
                assignedByMe.map((task) => (
                  <div key={task.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#232323]">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{task.title}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem className="text-white hover:bg-gray-700" onClick={() => handleEditTask(task)}>
                            Edit Task
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-white hover:bg-gray-700 text-red-400" onClick={() => handleDeleteTask(task.id)}>
                            Delete Task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {task.description && <p className="text-gray-300 text-sm mb-3">{task.description}</p>}

                    <div className="flex flex-wrap gap-2 mb-3">
                      {task.status !== "Done" && (
                        <>
                      <Badge className={`${getPriorityColor(task.priority)} text-white`}>{task.priority}</Badge>
                          {isDeadlineApproaching(task.dueDate, task.status) && (
                            <Badge className="bg-orange-500 text-white">Deadline Approaching</Badge>
                          )}
                          {isDeadlineCrossed(task.dueDate, task.status) && (
                            <Badge className="bg-red-500 text-white">Deadline Crossed</Badge>
                          )}
                        </>
                      )}
                      <Badge className={`${getStatusColor(task.status)} text-white`}>{task.status}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Due: {formatDate(task.dueDate)}
                      </div>
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <User className="w-4 h-4 mr-1" />
                        {task.assignees && task.assignees.length > 0
                          ? task.assignees.map(a => a.email).join(", ")
                          : "Unassigned"}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="w-24 bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#171717] flex items-center justify-center"
                        onClick={() => handleOpenAssignModal(task.id)}
                      >
                        Assign
                      </Button>
                      <Button
                        size="sm"
                        className="w-24 bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#171717] flex items-center justify-center"
                        onClick={() => setOpenChatTaskId(task.id)}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-400">Loading tasks...</div>
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      <Dialog open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen}>
        <DialogContent className="bg-black border-[#232323] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <Label htmlFor="teamName" className="text-gray-300">Team Name *</Label>
              <Input id="teamName" value={teamName} onChange={e => setTeamName(e.target.value)} className="bg-[#171717] border-[#232323] text-white placeholder:text-gray-400 focus:border-[#3ecf8e]" />
            </div>
            <div>
              <Label htmlFor="teamEmails" className="text-gray-300">Add Members (by email)</Label>
              <div className="flex gap-2 mt-1">
                <Input id="teamEmails" ref={teamInputRef} value={teamEmailInput} onChange={e => setTeamEmailInput(e.target.value)} className="bg-[#171717] border-[#232323] text-white placeholder:text-gray-400 focus:border-[#3ecf8e]" placeholder="user@example.com" />
                <Button type="button" onClick={handleAddTeamEmail} className="bg-[#3ecf8e] text-[#171717]">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {teamEmails.map(email => (
                  <span key={email} className="bg-[#171717] px-3 py-1 rounded-full text-xs">{email}</span>
                ))}
              </div>
            </div>
            {teamCreateError && <p className="text-red-400 text-sm">{teamCreateError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsTeamModalOpen(false)} className="border-[#232323] text-white hover:bg-[#171717] bg-transparent">Cancel</Button>
              <Button type="submit" className="bg-[#3ecf8e] text-[#171717]">Create Team</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Task Modal, now with team members */}
      <CreateTaskModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} teamMembers={teamMembers} />

      {/* Edit Task Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editTaskData && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-title" className="text-gray-300">Title *</Label>
                <Input id="edit-title" value={editTaskData.title} onChange={e => setEditTaskData({ ...editTaskData, title: e.target.value })} className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-[#3ecf8e]" />
                {editErrors.title && <p className="text-red-400 text-sm mt-1">{editErrors.title}</p>}
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-gray-300">Description</Label>
                <Textarea id="edit-description" value={editTaskData.description} onChange={e => setEditTaskData({ ...editTaskData, description: e.target.value })} className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-[#3ecf8e]" rows={3} />
              </div>
              <div>
                <Label htmlFor="edit-dueDate" className="text-gray-300">Due Date *</Label>
                <Input id="edit-dueDate" type="date" value={editTaskData.dueDate} onChange={e => setEditTaskData({ ...editTaskData, dueDate: e.target.value })} className="bg-gray-700 border-gray-600 text-white focus:border-[#3ecf8e]" />
                {editErrors.dueDate && <p className="text-red-400 text-sm mt-1">{editErrors.dueDate}</p>}
              </div>
              <div>
                <Label htmlFor="edit-priority" className="text-gray-300">Priority *</Label>
                <Select value={editTaskData.priority} onValueChange={value => setEditTaskData({ ...editTaskData, priority: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:border-[#3ecf8e]">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="Low" className="text-white hover:bg-gray-600">Low</SelectItem>
                    <SelectItem value="Medium" className="text-white hover:bg-gray-600">Medium</SelectItem>
                    <SelectItem value="High" className="text-white hover:bg-gray-600">High</SelectItem>
                  </SelectContent>
                </Select>
                {editErrors.priority && <p className="text-red-400 text-sm mt-1">{editErrors.priority}</p>}
              </div>
              <div>
                <Label htmlFor="edit-assignees" className="text-gray-300">Assignees *</Label>
                <div className="flex flex-col gap-2 mt-2">
                  {teamMembers.map(member => (
                    <label key={member.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={editTaskData.assigneeIds?.includes(member.id) || false}
                        onCheckedChange={checked => {
                          const current = editTaskData.assigneeIds || [];
                          setEditTaskData({
                            ...editTaskData,
                            assigneeIds: checked
                              ? [...current, member.id]
                              : current.filter((id: number) => id !== member.id),
                          })
                        }}
                      />
                      <span>{member.email}{user?.id === member.id ? " (me)" : ""}</span>
                    </label>
                  ))}
                </div>
                {editErrors.assigneeIds && <p className="text-red-400 text-sm mt-1">{editErrors.assigneeIds}</p>}
              </div>
              {editErrors.general && <p className="text-red-400 text-sm mt-1">{editErrors.general}</p>}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditModalOpen(false)} className="border-gray-600 text-white hover:bg-gray-700 bg-transparent">Cancel</Button>
                <Button type="submit" disabled={editLoading} className="bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#171717]">{editLoading ? "Saving..." : "Save Changes"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <div className="py-4">Are you sure you want to delete this task? This action cannot be undone.</div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="border-gray-600 text-white hover:bg-gray-700 bg-transparent">Cancel</Button>
            <Button onClick={confirmDeleteTask} className="bg-red-500 hover:bg-red-600 text-white">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat modal for a specific task */}
      {openChatTaskId && (
        <Dialog open={!!openChatTaskId} onOpenChange={() => setOpenChatTaskId(null)}>
          <DialogContent className="bg-[#141414] border-none text-white max-w-md shadow-2xl rounded-2xl p-0 overflow-hidden p-4">
            <DialogHeader>
              <DialogTitle className="text-center mt-2 mb-4">
                {(() => {
                  const chat = userChats.find(c => c.taskId?.toString() === openChatTaskId?.toString());
                  if (chat && chat.taskTitle) return chat.taskTitle;
                  const task = tasks.find(t => t.id === openChatTaskId?.toString());
                  if (task && task.title) return task.title;
                  return `Task Chat`;
                })()}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col h-96">
              <div className="flex-1 overflow-y-auto bg-[#18181b] rounded p-6 mb-2 border border-[#232323] mt-2">
                {chatLoading ? (
                  <div className="text-gray-400 text-center py-8">Loading chat...</div>
                ) : chatMessages.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">No messages yet</div>
                ) : (
                  chatMessages.map((msg, idx) => {
                    const isSelf = msg.senderId === user?.id;
                    const showAvatar = !isSelf && (idx === 0 || chatMessages[idx-1]?.senderId !== msg.senderId);
                    const showEmail = idx === 0 || chatMessages[idx-1]?.senderId !== msg.senderId;
                    return (
                      <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} mb-6`}>
                        {!isSelf && showAvatar && (
                          <div className="flex flex-col items-end mr-2">
                            <div className="w-8 h-8 rounded-full bg-[#232323] flex items-center justify-center text-base font-bold text-[#3ecf8e]">
                              {msg.sender?.email ? msg.sender.email[0].toUpperCase() : '?'}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-col max-w-[70%] mx-2">
                          {showEmail && (
                            <div className={`text-xs mb-1 ${isSelf ? 'text-[#3ecf8e] text-right' : 'text-gray-400 text-left'}`}>{msg.sender?.email || 'User'}</div>
                          )}
                          <div className={`px-4 py-2 rounded-2xl ${isSelf ? 'bg-[#e6fff3] text-[#171717] rounded-br-md' : 'bg-[#23232b] text-white rounded-bl-md'} shadow-sm`}>
                            <span>{msg.content}</span>
                          </div>
                          <span className={`text-xs mt-1 ${isSelf ? 'text-[#3ecf8e]' : 'text-gray-400'} pl-1`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2 mt-4 px-2 pb-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-full bg-[#18181b] border border-[#232323] px-4 py-2 text-white focus:outline-none focus:border-[#3ecf8e] placeholder:text-gray-500"
                />
                <Button type="submit" className="bg-[#3ecf8e] text-[#171717] px-4 py-2 rounded-full shadow-none" disabled={!chatInput.trim()}>
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
            <div className="flex justify-end mt-6 px-2 pb-2">
              <Button onClick={() => setOpenChatTaskId(null)} className="bg-[#3ecf8e] text-[#171717] rounded-full px-6 py-2">Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Task Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="bg-[#18181b] border border-[#232323] text-white max-w-md shadow-2xl rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="pt-8 px-8">
            <DialogTitle>Assign Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-8 pb-8 pt-2">
            {teamMembers.length === 0 ? (
              <div className="text-red-400 text-center py-4">No team members found. Please add team members first.</div>
            ) : (
              <>
                <label htmlFor="assign-members" className="block text-gray-300 mb-1">Select team members to assign</label>
                <div className="flex flex-col gap-3 mt-2">
                  {teamMembers.map(member => (
                    <label key={member.id} className="flex items-center gap-2 text-white">
                      <Checkbox
                        checked={assignSelectedEmails.includes(member.email)}
                        onCheckedChange={checked => {
                          setAssignSelectedEmails(prev =>
                            checked ? [...prev, member.email] : prev.filter(e => e !== member.email)
                          )
                        }}
                        className="border-[#3ecf8e] focus:ring-[#3ecf8e] bg-[#232323]"
                      />
                      <span>{member.email}{user?.id === member.id ? " (me)" : ""}</span>
                    </label>
                  ))}
                </div>
                {assignError && <p className="text-red-400 text-sm">{assignError}</p>}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setAssignModalOpen(false)} className="border-[#232323] text-white hover:bg-[#232323] bg-transparent rounded-lg px-6 py-2">Cancel</Button>
                  <Button onClick={handleAssign} disabled={assignLoading || !assignSelectedEmails.length} className="bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#171717] rounded-lg px-6 py-2 font-bold shadow">
                    {assignLoading ? "Assigning..." : "Assign"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Team Modal */}
      <Dialog open={isManageTeamModalOpen} onOpenChange={setIsManageTeamModalOpen}>
        <DialogContent className="bg-[#141414] border-none text-white max-w-md shadow-2xl rounded-2xl p-0 overflow-hidden">
          <div className="flex flex-col items-center pt-6">
            <div className="w-14 h-14 bg-[#232323] rounded-full flex items-center justify-center mb-2">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="text-xl font-bold mb-1">Manage Team</div>
            <div className="text-gray-400 mb-4 text-sm">Add or remove members from your team.</div>
            <div className="w-full px-6">
              <input
                type="text"
                placeholder="Search and add team members"
                value={newMemberEmail}
                onChange={e => setNewMemberEmail(e.target.value)}
                className="w-full mb-4 px-4 py-2 rounded-lg bg-[#18181b] border border-[#232323] text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3ecf8e]"
              />
              <div className="mb-4">
                <div className="text-gray-300 text-xs mb-2">TEAM MEMBERS</div>
                <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {teamMembers.map((member, idx) => (
                    <li key={member.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#232323] flex items-center justify-center text-lg font-bold text-[#3ecf8e]">
                          {member.email[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm flex items-center gap-2">
                            {member.email}
                            {user?.id === member.id && <span className="text-xs text-[#3ecf8e]">(me)</span>}
                          </div>
                        </div>
                      </div>
                      {user?.id === teamIdOwner && member.id !== user?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border border-red-500 text-red-400 hover:bg-red-900/30 px-3 py-1 rounded-lg text-xs"
                          onClick={async () => {
                            setManageTeamError("")
                            try {
                              const token = localStorage.getItem("authToken")
                              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/teams/${teamId}/remove-member`, {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                                },
                                body: JSON.stringify({ userId: member.id }),
                              })
                              if (!res.ok) {
                                const data = await res.json()
                                setManageTeamError(data.message || "Failed to remove member")
                              } else {
                                if (teamId != null) fetchTeamMembersForTeam(teamId)
                              }
                            } catch {
                              setManageTeamError("Server error removing member")
                            }
                          }}
                        >Remove</Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {user?.id === teamIdOwner && (
                <div className="flex flex-col gap-3 mt-2">
                  <Button
                    type="button"
                    className="bg-[#3ecf8e] text-[#171717] font-bold rounded-lg py-2"
                    onClick={async () => {
                      setManageTeamError("")
                      if (!newMemberEmail.trim()) return
                      try {
                        const token = localStorage.getItem("authToken")
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/teams/${teamId}/add-member`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                          },
                          body: JSON.stringify({ email: newMemberEmail.trim() }),
                        })
                        if (!res.ok) {
                          const data = await res.json()
                          setManageTeamError(data.message || "Failed to add member")
                        } else {
                          setNewMemberEmail("")
                          if (teamId != null) fetchTeamMembersForTeam(teamId)
                        }
                      } catch {
                        setManageTeamError("Server error adding member")
                      }
                    }}
                  >
                    Add Member
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-[#232323] text-gray-300 rounded-lg py-2 border border-[#232323] cursor-pointer mb-4 hover:bg-[#333] hover:text-white transition"
                    onClick={() => setIsManageTeamModalOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              )}
              {manageTeamError && <p className="text-red-400 text-sm mt-2">{manageTeamError}</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tasks Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="bg-[#141414] border-none text-white max-w-md shadow-2xl rounded-2xl p-0 overflow-hidden">
          <div className="p-6">
            <div className="text-lg font-semibold mb-1">Total Completed Tasks</div>
            <div className="text-3xl font-bold mb-6">{tasks.filter(t => t.status === 'Done').length}</div>
            <Bar
              data={{
                labels: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
                datasets: [{
                  label: 'Completed Tasks',
                  data: [0, 0, 0, 0, 0, 0, 0].map((_, i) =>
                    tasks.filter(t => t.status === 'Done' && new Date(t.updatedAt).getDay() === ((i + 1) % 7)).length
                  ),
                  backgroundColor: [
                    '#2196f3', // Mo
                    '#00bcd4', // Tu
                    '#9c27b0', // We
                    '#ff1744', // Th
                    '#ff9100', // Fr
                    '#ffd600', // Sa
                    '#757575', // Su
                  ],
                  borderRadius: 8,
                  barPercentage: 0.6,
                  categoryPercentage: 0.7,
                }],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: true },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: '#bbb', font: { weight: 'bold', size: 14 } },
                  },
                  y: {
                    grid: { color: '#222' },
                    ticks: { color: '#bbb', font: { weight: 'bold', size: 14 } },
                    beginAtZero: true,
                    suggestedMax: Math.max(5, ...[0, 0, 0, 0, 0, 0, 0].map((_, i) =>
                      tasks.filter(t => t.status === 'Done' && new Date(t.updatedAt).getDay() === ((i + 1) % 7)).length
                    )),
                  },
                },
              }}
              height={220}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add overlay with blur when notifOpen or chatListOpen is true */}
      {(notifOpen || chatListOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => {
            if (notifOpen) setNotifOpen(false);
            if (chatListOpen) setChatListOpen(false);
          }}
        />
      )}
    </div>
  )
}
