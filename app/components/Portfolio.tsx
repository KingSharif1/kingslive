"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

const projects = [
  {
    title: "Come And Take It Collectibles",
    description: "A professional e-commerce platform specializing in rare coins, collectibles, and silver rounds. Features include secure payments, product categorization, and detailed numismatic descriptions.",
    image: "/coins-store.png",
    demo: "https://comeandtakeitcollectibles.com/",
    tags: ["WordPress", "WooCommerce", "E-commerce", "Payment Gateway", "SEO", "Product Management"],
    status: "completed"
  },
  {
    title: "Sweet Emporium",
    description: "An exotic candy e-commerce website offering unique and international sweets. Features modern design, inventory management, and seamless checkout experience.",
    image: "/sweet-emporium.png",
    demo: "https://mysweetemporium.com/",
    tags: ["WordPress", "WooCommerce", "E-commerce", "Inventory Management", "Payment Processing"],
    status: "in-progress"
  },
  {
    title: "DFW NEMT Calculator",
    description: "A specialized calculator for Non-Emergency Medical Transportation services in DFW area. Handles complex rate calculations, Excel processing, and integrates with Strapi backend.",
    image: "/nemt-calc.png",
    github: "https://github.com/KingSharif1/DfwNemt",
    demo: "#",
    tags: ["React", "Excel Processing", "Strapi", "API Integration", "Business Logic", "TypeScript"],
    status: "in-progress"
  },
  {
    title: "Budget Buddy Savant",
    description: "A comprehensive financial management application designed to help users track expenses, set budgets, and achieve financial goals through intuitive visualizations and smart insights.",
    image: "/budget-saver.png",
    github: "https://github.com/KingSharif1/budget-buddy-savant",
    demo: "#",
    tags: ["React", "TypeScript", "Node.js", "Financial Analytics", "Data Visualization"],
    status: "in-progress"
  },
  {
    title: "Vision Board App",
    description: "An interactive digital vision board creator that helps users visualize and organize their goals. Features include drag-and-drop interface, goal categorization, and progress tracking.",
    image: "/vision-board.png",
    github: "https://github.com/KingSharif1/VisionBoard",
    demo: "#",
    tags: ["React", "Next.js", "Drag-and-Drop", "User Authentication"],
    status: "in-progress"
  }
]

export default function Portfolio() {
  const [visibleProjects, setVisibleProjects] = useState(3)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const toggleProjects = () => {
    setIsExpanded(!isExpanded)
    setVisibleProjects(isExpanded ? 3 : projects.length)
  }

  return (
    <section id="portfolio" className="portfolio-section py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 light-mode-text dark:text-white">Portfolio</h2>
          <p className="text-lg max-w-3xl mx-auto light-mode-text dark:text-white">
            Check out some of my recent projects
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence initial={false} mode="sync">
            {projects.slice(0, visibleProjects).map((project, index) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden h-full bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow duration-300 rounded-xl">
                  <CardContent className="p-0">
                    <div className="relative h-48 rounded-t-xl overflow-hidden">
                      <Image
                        src={project.image || "/placeholder.svg"}
                        alt={project.title}
                        fill
                        className="object-cover"
                      />
                      {project.status === "in-progress" && (
                        <div className="absolute top-2 right-2">
                          <span className="px-3 py-1 bg-yellow-500 text-white text-sm rounded-full">
                            Coming Soon
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2 light-mode-text dark:text-white">{project.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tags.map((tag) => (
                          <span 
                            key={tag} 
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full text-sm text-blue-800 dark:text-blue-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-4">
                        {project.github && (
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <Github className="w-5 h-5" />
                            Code
                          </a>
                        )}
                        {project.demo && project.demo !== "#" && (
                          <a
                            href={project.demo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <ExternalLink className="w-5 h-5" />
                            Visit Site
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {projects.length > 3 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <Button
              onClick={toggleProjects}
              variant="outline"
              size="lg"
              className="group rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="flex items-center gap-2">
                {isExpanded ? (
                  <>
                    Show Less
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </motion.div>
                  </>
                ) : (
                  <>
                    Load More
                    <motion.div
                      animate={{ y: [0, 4, 0] }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.div>
                  </>
                )}
              </span>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  )
}
