"use client"

import type React from "react"

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { createTask } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  teamMembers: { id: number; email: string }[]
}

export function CreateTaskModal({ isOpen, onClose, teamMembers }: CreateTaskModalProps) {
  const dispatch = useAppDispatch()
  const { loading, user } = useAppSelector((state) => state.app)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required"
    } else {
      const selectedDate = new Date(formData.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) newErrors.dueDate = "Due date cannot be in the past"
    }
    if (!formData.priority) newErrors.priority = "Priority is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !user) return
    try {
      await dispatch(
        createTask({
          title: formData.title.trim(),
          description: formData.description.trim(),
          dueDate: formData.dueDate,
          priority: formData.priority,
          assigneeIds: selectedAssignees,
        }),
      ).unwrap()
      setFormData({ title: "", description: "", dueDate: "", priority: "" })
      setSelectedAssignees([])
      setErrors({})
      onClose()
    } catch (error) {
      console.error("Failed to create task:", error)
    }
  }

  const handleClose = () => {
    setFormData({ title: "", description: "", dueDate: "", priority: "" })
    setSelectedAssignees([])
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#141414] border-none text-white max-w-md shadow-2xl rounded-2xl p-0 overflow-hidden">
        <div className="pt-8 px-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-4">Create New Task</DialogTitle>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 px-8 pb-8 pt-4">
          <div>
            <Label htmlFor="title" className="text-gray-200 mb-1 block">Title *</Label>
            <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter task title" className="bg-[#18181b] border border-[#232323] text-white placeholder:text-gray-500 focus:border-[#3ecf8e] rounded-lg px-4 py-2" />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
          </div>
          <div>
            <Label htmlFor="description" className="text-gray-200 mb-1 block">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter task description (optional)" className="bg-[#18181b] border border-[#232323] text-white placeholder:text-gray-500 focus:border-[#3ecf8e] rounded-lg px-4 py-2" rows={3} />
          </div>
          <div>
            <Label htmlFor="dueDate" className="text-gray-200 mb-1 block">Due Date *</Label>
            <div className="relative">
              <Input id="dueDate" type="datetime-local" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="bg-[#18181b] border border-[#232323] text-white placeholder:text-gray-500 focus:border-[#3ecf8e] rounded-lg pl-12 py-2" placeholder="Select date and time" />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3ecf8e] pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </span>
            </div>
            {errors.dueDate && <p className="text-red-400 text-sm mt-1">{errors.dueDate}</p>}
          </div>
          <div>
            <Label htmlFor="priority" className="text-gray-200 mb-1 block">Priority *</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger className="bg-[#18181b] border border-[#232323] text-white focus:border-[#3ecf8e] rounded-lg px-4 py-2">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent className="bg-[#18181b] border border-[#232323]">
                <SelectItem value="Low" className="text-white hover:bg-gray-600">Low</SelectItem>
                <SelectItem value="Medium" className="text-white hover:bg-gray-600">Medium</SelectItem>
                <SelectItem value="High" className="text-white hover:bg-gray-600">High</SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && <p className="text-red-400 text-sm mt-1">{errors.priority}</p>}
          </div>
          <div>
            <Label htmlFor="assignees" className="text-gray-200 mb-1 block">Assign to <span className="text-gray-400">(multiple allowed)</span></Label>
            {teamMembers.length === 0 ? (
              <div className="text-red-400 text-sm mt-2">You must create or join a team to assign tasks to users.</div>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                {teamMembers.map(member => (
                  <label key={member.id} className="flex items-center gap-2 text-white">
                    <Checkbox
                      checked={selectedAssignees.includes(member.id)}
                      onCheckedChange={checked => {
                        setSelectedAssignees(prev =>
                          checked ? [...prev, member.id] : prev.filter(id => id !== member.id)
                        )
                      }}
                      className="border-[#3ecf8e] focus:ring-[#3ecf8e]"
                    />
                    <span>{member.email}{user?.id === member.id ? " (me)" : ""}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="border-[#232323] text-white hover:bg-[#232323] bg-transparent rounded-lg px-6 py-2">Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#171717] rounded-lg px-6 py-2 font-bold shadow">{loading ? "Creating..." : "Create Task"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

<style jsx global>{`
  input[type="datetime-local"]::-webkit-calendar-picker-indicator {
    filter: invert(56%) sepia(98%) saturate(469%) hue-rotate(97deg) brightness(97%) contrast(92%);
  }
`}</style>
