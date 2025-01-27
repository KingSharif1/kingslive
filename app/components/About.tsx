"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Code, Lightbulb, Target } from "lucide-react"

const features = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "Problem Solver",
    description: "Analytical thinker with a passion for solving complex challenges.",
  },
  {
    icon: <Code className="w-6 h-6" />,
    title: "Developer",
    description: "Skilled in creating modern and responsive web applications.",
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Goal-Oriented",
    description: "Focused on delivering high-quality results and meeting objectives.",
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    title: "Innovative",
    description: "Always exploring new technologies and creative solutions.",
  },
]

export default function About() {
  return (
    <section id="about" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 light-mode-text dark:text-white">About Me</h2>
          <p className="border-2 bg-gray-100 dark:bg-gray-900/50 backdrop-blur-md border-gray-300 dark:border-gray-800 text-lg light-mode-text dark:text-white max-w-3xl mx-auto p-4 rounded-xl">
            I am a passionate developer who believes in the power of technology to solve real-world problems. With a
            strong foundation in modern web development, I create engaging and functional applications.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full bg-white dark:bg-gray-900/50 backdrop-blur-sm border-gray-300 dark:border-gray-800 rounded-xl">
                <CardContent className="p-6 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 mx-auto">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-center light-mode-text dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
