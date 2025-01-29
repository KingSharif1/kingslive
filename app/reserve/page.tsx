'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { CompactCountdown } from "../components/CompactCountdown"
import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  contact: z.string().min(1, {
    message: "Please provide an email or phone number.",
  }),
  attendLive: z.boolean().default(false),
  celebrateHome: z.boolean().default(false),
})

export default function ReservePage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contact: "",
      attendLive: false,
      celebrateHome: false,
    },
  })

  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error('Failed to submit reservation')
      }

      toast({
        title: "Thank you!",
        description: "We've received your RSVP.",
      })
      form.reset()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Failed to submit your RSVP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md space-y-4">
        <motion.div
          className="mb-6"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button
            onClick={() => router.push('/')}
            className="group flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              whileHover={{ x: -5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.div>
            <span className="font-medium">Back Home</span>
          </motion.button>
        </motion.div>
        <div className="scale-90 transform-gpu">
          <CompactCountdown />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Reserve</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Let us know how you&apos;ll be celebrating
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your name"
                      className="bg-neutral-900 border-neutral-800 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email or Phone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your email or phone number"
                      className="bg-neutral-900 border-neutral-800 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="attendLive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Attend Live
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="celebrateHome"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Celebrate at Home
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
