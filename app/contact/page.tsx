"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Mail, MessageSquare, User, MailOpen } from "lucide-react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
})

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  })

  const formFields = [
    { name: "name", label: "Name", placeholder: "John Doe", icon: User },
    { name: "email", label: "Email", placeholder: "john@example.com", icon: Mail },
    { name: "message", label: "Message", placeholder: "Your message here...", icon: MessageSquare },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  }

  const successVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        toast({
          title: "Message sent!",
          description: "Thank you for your message. We'll get back to you soon.",
        })
        form.reset()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="py-20 bg-gradient-to-b from-background to-muted">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Get in Touch
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Have a question or want to work together? I'd love to hear from you. Send me a message and I'll respond as soon as possible.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 24,
                delay: 0.2,
              }}
              className="max-w-2xl mx-auto"
            >
              <Card className="shadow-lg rounded-xl overflow-hidden">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                >
                  <CardHeader>
                    <motion.div variants={itemVariants}>
                      <CardTitle>Send a Message</CardTitle>
                      <CardDescription>Fill out the form below to get in touch with me.</CardDescription>
                    </motion.div>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {formFields.map((field, index) => (
                          <motion.div key={field.name} variants={itemVariants}>
                            <FormField
                              control={form.control}
                              name={field.name as "name" | "email" | "message"}
                              render={({ field: formField }) => (
                                <FormItem>
                                  <FormLabel>{field.label}</FormLabel>
                                  <FormControl>
                                    <div className="relative group">
                                      {field.name === "message" ? (
                                        <Textarea
                                          placeholder={field.placeholder}
                                          {...formField}
                                          className="pl-10 min-h-[120px] transition-all duration-200 border-primary/20 focus:border-primary group-hover:border-primary/50 rounded-xl"
                                          disabled={loading}
                                        />
                                      ) : (
                                        <Input
                                          placeholder={field.placeholder}
                                          {...formField}
                                          className="pl-10 transition-all duration-200 border-primary/20 focus:border-primary group-hover:border-primary/50 rounded-xl"
                                          disabled={loading}
                                        />
                                      )}
                                      <field.icon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-red-500" />
                                </FormItem>
                              )}
                            />
                          </motion.div>
                        ))}
                        <motion.div className="flex justify-around" variants={itemVariants}>
                          <Button
                            type="submit"
                            className="relative overflow-hidden transition-all duration-200 hover:scale-[1.02] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg hover:shadow-blue-500/25 rounded-xl"
                            disabled={loading}
                          >
                            <AnimatePresence mode="wait">
                              {loading ? (
                                <motion.div
                                  key="loading"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500"
                                >
                                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="send"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="flex items-center justify-center gap-2 px-6"
                                >
                                  <span>Send Message</span>
                                  <MailOpen className="h-5 w-5" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Button>
                        </motion.div>
                      </form>
                    </Form>
                  </CardContent>
                </motion.div>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
