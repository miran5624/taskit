"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, Users, Calendar, BarChart3, ArrowRight, Menu, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

function useCountUp(end: number, duration = 2000, shouldStart = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!shouldStart) return

    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(end * easeOutQuart))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [end, duration, shouldStart])

  return count
}

function useIntersectionObserver(ref: React.RefObject<Element>, options?: IntersectionObserverInit) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(element)

    return () => observer.disconnect()
  }, [ref, options])

  return isIntersecting
}

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("hero")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const statsRef = useRef<HTMLDivElement>(null)
  const isStatsVisible = useIntersectionObserver(statsRef, { threshold: 0.3 })

  const activeTeamsCount = useCountUp(10000, 2000, isStatsVisible)
  const tasksCompletedCount = useCountUp(500000, 2500, isStatsVisible)
  const uptimeCount = useCountUp(99.9, 2000, isStatsVisible)

  // Email state for sign up
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const [typed, setTyped] = useState("");
  useEffect(() => {
    const word = "TaskIt";
    let i = 0;
    const interval = setInterval(() => {
      setTyped(word.slice(0, i + 1));
      i++;
      if (i === word.length) clearInterval(interval);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Handle sign up button click
  const handleSignUp = async () => {
    if (!email) {
      toast({
        title: "Missing email",
        description: "Please enter your email.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setTimeout(() => {
      router.push(`/signup?email=${encodeURIComponent(email)}`)
    }, 350)
  }

  // Handle Google sign in
  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google"
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 100)

      // Determine active section based on scroll position
      const sections = ["hero", "task-management", "team-collaboration", "due-date-management", "progress-reporting"]
      const sectionElements = sections.map((id) => document.getElementById(id))

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = sectionElements[i]
        if (element && scrollPosition >= element.offsetTop - 200) {
          setActiveSection(sections[i])
          break
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMobileMenuOpen(false)
  }

  const sectionIds = ["task-management", "team-collaboration", "due-date-management", "progress-reporting"];
  const sectionRefs = sectionIds.map(() => useRef<HTMLDivElement | null>(null));
  const allSectionIds = ["hero", ...sectionIds];
  const allSectionRefs = [useRef<HTMLDivElement | null>(null), ...sectionRefs];

  useEffect(() => {
    const navHeight = 64; // px, adjust if your navbar is a different height
    const handleScroll = () => {
      const offsets = allSectionRefs.map(ref => {
        if (!ref.current) return -Infinity;
        const rect = ref.current.getBoundingClientRect();
        return rect.top - navHeight;
      });
      // Find the last section whose top is <= 0
      let idx = 0;
      for (let i = 0; i < offsets.length; i++) {
        if (offsets[i] <= 0) idx = i;
      }
      setActiveSection(allSectionIds[idx]);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#171717] text-white">
      {/* Fixed Navigation Bar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-black/60 backdrop-blur-md border-b border-white/10"
            : "bg-black/40 backdrop-blur-md border-b border-white/10"
        }`}
      >
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#3ecf8e] rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#171717]" />
            </div>
            <span className="text-xl font-bold">TaskIt</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {[
              { id: "task-management", label: "Task Management" },
              { id: "team-collaboration", label: "Team Collaboration" },
              { id: "due-date-management", label: "Due Dates" },
              { id: "progress-reporting", label: "Reporting" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`text-sm font-medium transition-colors hover:text-[#3ecf8e] ${activeSection === item.id ? "text-[#3ecf8e] border-b-2 border-[#3ecf8e] pb-1" : "text-gray-300"} ${activeSection === 'hero' ? '!border-b-0' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/signin">
              <Button variant="ghost" className="text-white hover:text-[#3ecf8e]">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#171717]">Get Started</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#171717] border-t border-gray-800">
            <div className="container mx-auto px-4 py-4 space-y-4">
              {[
                { id: "task-management", label: "Task Management" },
                { id: "team-collaboration", label: "Team Collaboration" },
                { id: "due-date-management", label: "Due Dates" },
                { id: "progress-reporting", label: "Reporting" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="block w-full text-left text-gray-300 hover:text-[#3ecf8e] py-2"
                >
                  {item.label}
                </button>
              ))}
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-800">
                <Link href="/signin">
                  <Button variant="ghost" className="w-full text-white hover:text-[#3ecf8e]">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="w-full bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#171717]">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="min-h-screen flex items-center border-4 border-[#3ecf8e] rounded-3xl mt-16 relative bg-transparent" ref={allSectionRefs[0]}>
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Great outcomes start with {" "}
                  <span className="text-[#3ecf8e] align-middle">
                    {typed}
                    <span className="border-r-2 border-[#3ecf8e] animate-blink ml-0.5" style={{display:'inline-block',height:'1em',verticalAlign:'-0.1em'}}></span>
                  </span>
                </h1>
                <p className="text-xl text-gray-300 max-w-2xl">
                  The only project management tool you need to plan and track work across every team. Collaborate
                  seamlessly and deliver exceptional results.
                </p>
              </div>
            </div>

            <div className="bg-[#181b20] rounded-2xl p-8 border border-[#232323]">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Work email</label>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-[#3ecf8e]"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Using a work email helps find teammates and boost collaboration.
                  </p>
                </div>

                <Button
                  className="w-full bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#171717] font-semibold py-3"
                  onClick={handleSignUp}
                  disabled={loading}
                >
                  {loading ? "Redirecting..." : "Sign up"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Stacking Sections */}
      <div className="relative">
        {/* Task Management Section */}
        <section id="task-management" className="sticky top-0 min-h-screen bg-[#171717] flex items-center z-10" ref={allSectionRefs[1]}>
          <div className="container mx-auto px-4 lg:px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 bg-[#3ecf8e]/10 text-[#3ecf8e] px-4 py-2 rounded-full text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    <span>Task Management</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold">
                    Create and organize tasks with <span className="text-[#3ecf8e]">precision</span>
                  </h2>
                  <p className="text-xl text-gray-300">
                    Build detailed task lists with descriptions, due dates, priorities, and assignees. Keep your team
                    organized and ensure nothing falls through the cracks.
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    "Rich task descriptions with markdown support",
                    "Priority levels to focus on what matters most",
                    "Smart due date reminders and notifications",
                    "Bulk task creation and management tools",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-[#3ecf8e] flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                {/* Placeholder for Task Management Screenshot */}
                <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700 min-h-[400px] flex items-center justify-center">
                  <img src="/images/img1.png" alt="Task Management Screenshot" className="rounded-xl max-h-[350px] w-auto object-contain shadow-lg" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Collaboration Section */}
        <section id="team-collaboration" className="sticky top-0 min-h-screen bg-gray-900 flex items-center z-20" ref={allSectionRefs[2]}>
          <div className="container mx-auto px-4 lg:px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                {/* Placeholder for Collaboration Screenshot */}
                <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700 min-h-[400px] flex items-center justify-center">
                  <img src="/images/img2.png" alt="Team Collaboration Screenshot" className="rounded-xl max-h-[350px] w-auto object-contain shadow-lg" />
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 bg-[#3ecf8e]/10 text-[#3ecf8e] px-4 py-2 rounded-full text-sm font-medium">
                    <Users className="w-4 h-4" />
                    <span>Team Collaboration</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold">
                    Work together <span className="text-[#3ecf8e]">seamlessly</span>
                  </h2>
                  <p className="text-xl text-gray-300">
                    Foster collaboration with real-time updates, team notifications, and shared workspaces. Keep
                    everyone aligned and productive, no matter where they are.
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    "Real-time task updates and notifications",
                    "Team member assignment and workload tracking",
                    "Collaborative comments and file sharing",
                    "Activity feeds to stay in the loop",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-[#3ecf8e] flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Due Date Management Section */}
        <section id="due-date-management" className="sticky top-0 min-h-screen bg-gray-800 flex items-center z-30" ref={allSectionRefs[3]}>
          <div className="container mx-auto px-4 lg:px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 bg-[#3ecf8e]/10 text-[#3ecf8e] px-4 py-2 rounded-full text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    <span>Due Date Management</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold">
                    Never miss a <span className="text-[#3ecf8e]">deadline</span>
                  </h2>
                  <p className="text-xl text-gray-300">
                    Stay on top of deadlines with intelligent due date tracking, automated reminders, and visual
                    timeline views. Turn deadline stress into deadline success.
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    "Smart deadline reminders and escalations",
                    "Visual timeline and calendar views",
                    "Deadline dependency tracking",
                    "Automated status updates for overdue tasks",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-[#3ecf8e] flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                {/* Placeholder for Due Date Management Screenshot */}
                <div className="bg-gray-700/50 rounded-2xl p-8 border border-gray-600 min-h-[400px] flex items-center justify-center">
                  <img src="/images/img3.png" alt="Due Date Management Screenshot" className="rounded-xl max-h-[350px] w-auto object-contain shadow-lg" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Progress Reporting Section */}
        <section id="progress-reporting" className="sticky top-0 min-h-screen bg-gray-700 flex items-center z-40" ref={allSectionRefs[4]}>
          <div className="container mx-auto px-4 lg:px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                {/* Placeholder for Progress Reporting Screenshot */}
                <div className="bg-gray-600/50 rounded-2xl p-8 border border-gray-500 min-h-[400px] flex items-center justify-center">
                  <img src="/images/img4.png" alt="Progress Reporting Screenshot" className="rounded-xl max-h-[350px] w-auto object-contain shadow-lg" />
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 bg-[#3ecf8e]/10 text-[#3ecf8e] px-4 py-2 rounded-full text-sm font-medium">
                    <BarChart3 className="w-4 h-4" />
                    <span>Progress Reporting</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold">
                    Track progress with <span className="text-[#3ecf8e]">detailed analytics</span>
                  </h2>
                  <p className="text-xl text-gray-300">
                    Get insights into team performance, project progress, and productivity trends. Make data-driven
                    decisions to optimize your workflow and deliver better results.
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    "Comprehensive team performance metrics",
                    "Project completion rate tracking",
                    "Workload distribution analysis",
                    "Custom reports and data exports",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-[#3ecf8e] flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="min-h-screen bg-[#171717] flex items-center relative z-50">
          <div className="container mx-auto px-4 lg:px-6 text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-6xl font-bold">
                Ready to transform your <span className="text-[#3ecf8e]">team's productivity</span>?
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Join thousands of teams who have streamlined their workflow and achieved better results with TaskIt.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/signup">
                  <Button className="bg-[#3ecf8e] hover:bg-[#3ecf8e]/90 text-[#171717] text-lg px-8 py-4 h-auto">
                    Get Started Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/signin">
                  <Button
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-800 text-lg px-8 py-4 h-auto bg-transparent"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
              <div ref={statsRef} className="grid md:grid-cols-3 gap-8 mt-16 text-center">
                <div>
                  <div className="text-3xl font-bold text-[#3ecf8e] mb-2">{activeTeamsCount.toLocaleString()}+</div>
                  <div className="text-gray-400">Active Teams</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#3ecf8e] mb-2">{tasksCompletedCount.toLocaleString()}+</div>
                  <div className="text-gray-400">Tasks Completed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#3ecf8e] mb-2">{uptimeCount.toFixed(1)}%</div>
                  <div className="text-gray-400">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-[#3ecf8e] rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[#171717]" />
              </div>
              <span className="text-xl font-bold">TaskIt</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link href="#" className="hover:text-[#3ecf8e]">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-[#3ecf8e]">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-[#3ecf8e]">
                Contact
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© 2025 TaskIt. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
