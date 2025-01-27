"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { ChevronDown } from "lucide-react"
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js"
import { Radar } from "react-chartjs-2"

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface Skill {
  name: string
  level: number
  frequency: number
  color: string
  category: string
}

const allSkills: Skill[] = [
  // Core Web Development - Daily Use
  { 
    name: "React",
    level: 95,
    frequency: 100,
    color: "#61DAFB",
    category: "Core Web Development"
  },
  { 
    name: "Next.js",
    level: 90,
    frequency: 100,
    color: "#000000",
    category: "Core Web Development"
  },
  { 
    name: "TypeScript",
    level: 90,
    frequency: 100,
    color: "#3178C6",
    category: "Core Web Development"
  },
  { 
    name: "JavaScript",
    level: 95,
    frequency: 100,
    color: "#F7DF1E",
    category: "Core Web Development"
  },
  { 
    name: "Node.js",
    level: 85,
    frequency: 90,
    color: "#339933",
    category: "Core Web Development"
  },
  
  // E-commerce & CMS - Weekly Use
  { 
    name: "WordPress",
    level: 90,
    frequency: 80,
    color: "#21759B",
    category: "E-commerce & CMS"
  },
  { 
    name: "WooCommerce",
    level: 85,
    frequency: 80,
    color: "#96588A",
    category: "E-commerce & CMS"
  },
  { 
    name: "E-commerce",
    level: 90,
    frequency: 80,
    color: "#FF6384",
    category: "E-commerce & CMS"
  },
  { 
    name: "SEO",
    level: 85,
    frequency: 70,
    color: "#000000",
    category: "E-commerce & CMS"
  },
  { 
    name: "Content Management",
    level: 85,
    frequency: 75,
    color: "#FF9900",
    category: "E-commerce & CMS"
  },
  
  // UI/UX & Design - Daily Use
  { 
    name: "Tailwind CSS",
    level: 90,
    frequency: 100,
    color: "#38B2AC",
    category: "UI/UX & Design"
  },
  { 
    name: "Responsive Design",
    level: 90,
    frequency: 100,
    color: "#FF6B6B",
    category: "UI/UX & Design"
  },
  { 
    name: "UI/UX Design",
    level: 85,
    frequency: 90,
    color: "#FF9A8B",
    category: "UI/UX & Design"
  },
  { 
    name: "Framer Motion",
    level: 85,
    frequency: 85,
    color: "#FF0066",
    category: "UI/UX & Design"
  },
  
  // Backend & Database - Weekly Use
  { 
    name: "Express.js",
    level: 85,
    frequency: 75,
    color: "#000000",
    category: "Backend & Database"
  },
  { 
    name: "MongoDB",
    level: 80,
    frequency: 70,
    color: "#47A248",
    category: "Backend & Database"
  },
  { 
    name: "PostgreSQL",
    level: 80,
    frequency: 65,
    color: "#336791",
    category: "Backend & Database"
  },
  { 
    name: "Strapi",
    level: 85,
    frequency: 60,
    color: "#2F2E8B",
    category: "Backend & Database"
  },
  { 
    name: "API Development",
    level: 90,
    frequency: 85,
    color: "#4A90E2",
    category: "Backend & Database"
  },
  
  // Business & Analytics - Project Based
  { 
    name: "Business Logic",
    level: 90,
    frequency: 75,
    color: "#6772E5",
    category: "Business & Analytics"
  },
  { 
    name: "Data Processing",
    level: 85,
    frequency: 70,
    color: "#217346",
    category: "Business & Analytics"
  },
  { 
    name: "Financial Systems",
    level: 85,
    frequency: 65,
    color: "#20B2AA",
    category: "Business & Analytics"
  },
  { 
    name: "Analytics",
    level: 80,
    frequency: 60,
    color: "#FF6384",
    category: "Business & Analytics"
  },
  
  // Development Tools - Daily Use
  { 
    name: "Git",
    level: 90,
    frequency: 100,
    color: "#F05032",
    category: "Development Tools"
  },
  { 
    name: "Docker",
    level: 80,
    frequency: 60,
    color: "#2496ED",
    category: "Development Tools"
  },
  { 
    name: "AWS",
    level: 75,
    frequency: 50,
    color: "#FF9900",
    category: "Development Tools"
  }
]

export default function Skills() {
  const [showOtherSkills, setShowOtherSkills] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(
    new Set(["React", "Next.js", "TypeScript", "WordPress", "Business Logic"]),
  )

  const topSkills = allSkills.filter((skill) => selectedSkills.has(skill.name))
  const otherSkills = allSkills.filter((skill) => !selectedSkills.has(skill.name))

  const toggleSkill = (skillName: string) => {
    const newSelected = new Set(selectedSkills)
    if (selectedSkills.has(skillName)) {
      if (selectedSkills.size > 1) {
        newSelected.delete(skillName)
      }
    } else if (selectedSkills.size < 6) {
      newSelected.add(skillName)
    }
    setSelectedSkills(newSelected)
  }

  const radarData = {
    labels: topSkills.map((skill) => skill.name),
    datasets: [
      {
        label: "Skill Level",
        data: topSkills.map((skill) => skill.level),
        backgroundColor: "rgba(74, 144, 226, 0.2)",
        borderColor: "rgba(74, 144, 226, 1)",
        borderWidth: 1,
      },
      {
        label: "Usage Frequency",
        data: topSkills.map((skill) => skill.frequency),
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      }
    ],
  }

  const radarOptions = {
    scales: {
      r: {
        angleLines: {
          display: false,
        },
        suggestedMin: 0,
        suggestedMax: 100,
        grid: {
          color: "rgba(74, 144, 226, 0.1)",
        },
        ticks: {
          color: "#4A4A4A",
          backdropColor: "transparent",
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#4A4A4A",
        },
      },
    },
  }

  const getFrequencyText = (frequency: number): string => {
    if (frequency >= 90) return "Daily Use"
    if (frequency >= 70) return "Weekly Use"
    if (frequency >= 50) return "Monthly Use"
    return "Project Based"
  }

  return (
    <section id="skills" className="skills-section py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4 light-mode-text dark:text-white">Skills</h2>
          <p className="text-lg max-w-3xl mx-auto light-mode-text dark:text-white">
            Click on skills to add or remove them from the radar chart
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <Radar data={radarData} options={radarOptions} />
          </motion.div>

          <div className="space-y-6">
            {topSkills.map((skill, index) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => toggleSkill(skill.name)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 cursor-pointer transform hover:scale-105 transition-transform"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium light-mode-text dark:text-white">{skill.name}</span>
                  <span className="text-sm text-blue-600 dark:text-blue-400">{skill.level}%</span>
                </div>
                <Progress value={skill.level} className="h-2 mb-1 rounded-full" />
                <Progress value={skill.frequency} className="h-1 opacity-60 rounded-full" />
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16"
        >
          <button
            onClick={() => setShowOtherSkills(!showOtherSkills)}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex justify-between items-center light-mode-text dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <span className="text-xl font-bold">Other Skills</span>
            <ChevronDown
              className={`w-6 h-6 transition-transform duration-200 ${showOtherSkills ? "transform rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence>
            {showOtherSkills && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"
              >
                {otherSkills.map((skill, index) => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => toggleSkill(skill.name)}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 cursor-pointer transform hover:scale-105 transition-transform"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium light-mode-text dark:text-white">{skill.name}</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400">{skill.level}%</span>
                    </div>
                    <Progress value={skill.level} className="h-2 mb-1 rounded-full" />
                    <Progress value={skill.frequency} className="h-1 opacity-60 rounded-full" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
