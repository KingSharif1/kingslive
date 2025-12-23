"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { User, Mail, MessageSquare, MailOpen, X } from "lucide-react"
import { useState } from "react"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  message: z.string().min(10, "Message must be at least 10 characters."),
})

const formFields = [
  {
    name: "name",
    label: "Name",
    placeholder: "Enter your name",
    icon: User,
  },
  {
    name: "email",
    label: "Email",
    placeholder: "Enter your email",
    icon: Mail,
  },
  {
    name: "message",
    label: "Message",
    placeholder: "Enter your message",
    icon: MessageSquare,
  },
]

const formVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    y: -20,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.25 },
      y: { duration: 0.25 },
    },
  },
  visible: {
    opacity: 1,
    height: "auto",
    y: 0,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.25, delay: 0.15 },
      y: { duration: 0.25, delay: 0.15 },
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function ContactForm({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    // Add your form submission logic here
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulated delay
    setLoading(false)
    form.reset()
    onClose()
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={formVariants}
      className="overflow-hidden"
    >
      <div className="mt-8 border-2 border-border rounded-xl p-6 space-y-6 relative bg-background/5 backdrop-blur-sm backdrop-saturate-150 shadow-lg">
        <div className="flex justify-between items-center">
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-medium">Send a Message</h3>
            <p className="text-sm text-muted-foreground">Fill out the form below to get in touch.</p>
          </motion.div>
          <motion.button
            variants={itemVariants}
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {formFields.map((field) => (
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
      </div>
    </motion.div>
  )
}
