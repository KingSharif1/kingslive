"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Calendar, User, Tag } from "lucide-react"
import CommentSection from "@/app/components/CommentSection"
import { supabase } from "@/lib/supabase"

interface BlogPost {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  author: string
  slug: string
  tags: string[]
  published: boolean
  views: number
  cover_image?: string
  excerpt: string
}

// Sample blog posts data (in a real app, this would come from an API/database)
const SAMPLE_POSTS: Record<string, BlogPost> = {
  "building-portfolio-nextjs-typescript": {
    id: "1",
    title: "Building a Portfolio with Next.js and TypeScript",
    content: `
# Building a Portfolio with Next.js and TypeScript

Creating a modern portfolio website is essential for showcasing your skills and projects as a developer. In this post, I'll walk through how I built this portfolio using Next.js, TypeScript, and Tailwind CSS with a retro macOS aesthetic.

## Why Next.js?

Next.js provides an excellent framework for building React applications with features like:

- Server-side rendering
- Static site generation
- API routes
- File-based routing
- Built-in image optimization

These features make it perfect for a portfolio site that needs to be fast, SEO-friendly, and easy to maintain.

## TypeScript Integration

Adding TypeScript to the mix brings type safety and better developer experience:

\`\`\`typescript
interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  imageUrl: string;
  demoUrl?: string;
  githubUrl?: string;
}
\`\`\`

## Styling with Tailwind CSS

Tailwind CSS provides utility classes that make it easy to create consistent, responsive designs:

\`\`\`jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {projects.map(project => (
    <ProjectCard key={project.id} project={project} />
  ))}
</div>
\`\`\`

## Retro macOS Aesthetic

To achieve the retro macOS look, I used:

- Rounded corners
- Subtle shadows
- Window-like components
- Classic macOS-inspired icons
- Familiar UI patterns like the dock and menu bar

## Conclusion

Building a portfolio with Next.js, TypeScript, and Tailwind CSS offers a great developer experience and results in a performant, maintainable site. The retro macOS aesthetic adds a unique touch that makes the portfolio stand out.

Feel free to explore the site and check out the other projects I've worked on!
    `,
    created_at: "2025-08-10T12:00:00Z",
    updated_at: "2025-08-10T12:00:00Z",
    author: "King Sharif",
    slug: "building-portfolio-nextjs-typescript",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
    published: true,
    views: 124,
    excerpt: "Learn how I built this portfolio website using Next.js, TypeScript, and Tailwind CSS with a retro macOS aesthetic."
  },
  "integrating-ai-assistants-huggingface": {
    id: "2",
    title: "Integrating AI Assistants with Hugging Face",
    content: `
# Integrating AI Assistants with Hugging Face

Adding an AI assistant to your website can enhance user experience by providing instant responses to queries. In this post, I'll show you how I integrated a Hugging Face model into this portfolio site.

## Setting Up Hugging Face Inference API

First, you'll need to get an API key from Hugging Face:

1. Create an account on [Hugging Face](https://huggingface.co)
2. Generate an API key in your account settings
3. Store it securely in your environment variables

## Creating the API Route in Next.js

Next.js makes it easy to create serverless API routes:

\`\`\`typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    // Create a prompt for the AI
    const prompt = \`You are an assistant for a portfolio website.
    User: \${message}
    Assistant:\`;
    
    // Call Hugging Face API
    const response = await hf.textGeneration({
      model: "gpt2",
      inputs: prompt,
      parameters: {
        max_new_tokens: 100,
        temperature: 0.7
      }
    });
    
    return NextResponse.json({ message: response.generated_text });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    );
  }
}
\`\`\`

## Building the Chat UI

For the frontend, I created a simple chat interface:

\`\`\`jsx
const [messages, setMessages] = useState([]);
const [input, setInput] = useState("");

const sendMessage = async () => {
  if (!input.trim()) return;
  
  // Add user message
  setMessages(prev => [...prev, { role: "user", content: input }]);
  setInput("");
  
  try {
    // Call our API
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });
    
    const data = await response.json();
    
    // Add AI response
    setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
  } catch (error) {
    console.error("Error sending message:", error);
  }
};
\`\`\`

## Challenges and Solutions

Some challenges I encountered:

1. **API Rate Limits**: Free tier has limitations, so implement caching for common questions
2. **Response Quality**: Fine-tune prompts to get better responses
3. **Error Handling**: Always have fallback responses ready

## Conclusion

Integrating an AI assistant using Hugging Face's inference API adds a dynamic element to your portfolio. It allows visitors to interact with your site and learn more about you and your work in a conversational way.
    `,
    created_at: "2025-08-05T15:30:00Z",
    updated_at: "2025-08-06T09:15:00Z",
    author: "King Sharif",
    slug: "integrating-ai-assistants-huggingface",
    tags: ["AI", "Hugging Face", "Next.js"],
    published: true,
    views: 87,
    excerpt: "How to add an AI assistant to your website using Hugging Face's inference API and Next.js API routes."
  },
  "animated-ui-components-framer-motion": {
    id: "3",
    title: "Creating Animated UI Components with Framer Motion",
    content: `
# Creating Animated UI Components with Framer Motion

Adding animations to your React components can significantly improve user experience. Framer Motion is a powerful library that makes creating smooth animations in React applications straightforward and declarative.

## Getting Started with Framer Motion

First, install the library:

\`\`\`bash
npm install framer-motion
\`\`\`

## Basic Animations

Let's start with a simple fade-in animation:

\`\`\`jsx
import { motion } from "framer-motion";

const FadeIn = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {children}
  </motion.div>
);
\`\`\`

## Animating Lists

Animating lists is easy with Framer Motion:

\`\`\`jsx
import { motion, AnimatePresence } from "framer-motion";

const AnimatedList = ({ items }) => (
  <ul>
    <AnimatePresence>
      {items.map(item => (
        <motion.li
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {item.content}
        </motion.li>
      ))}
    </AnimatePresence>
  </ul>
);
\`\`\`

## Creating a Page Transition

For smooth page transitions:

\`\`\`jsx
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3
    }
  }
};

const Page = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    {children}
  </motion.div>
);
\`\`\`

## Gesture Animations

Framer Motion also supports gesture animations:

\`\`\`jsx
const DraggableCard = () => (
  <motion.div
    drag
    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
    whileDrag={{ scale: 1.1 }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="card"
  >
    Drag me!
  </motion.div>
);
\`\`\`

## Scroll Animations

Creating scroll-triggered animations:

\`\`\`jsx
import { useInView } from "react-intersection-observer";

const ScrollAnimation = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8 }}
    >
      I'll animate when scrolled into view!
    </motion.div>
  );
};
\`\`\`

## Conclusion

Framer Motion provides a powerful yet simple API for creating beautiful animations in React applications. By using these techniques, you can create engaging user interfaces that feel responsive and delightful to use.

Try implementing some of these animations in your own projects to see how they can enhance the user experience!
    `,
    created_at: "2025-07-28T08:45:00Z",
    updated_at: "2025-07-28T08:45:00Z",
    author: "King Sharif",
    slug: "animated-ui-components-framer-motion",
    tags: ["Framer Motion", "React", "Animation"],
    published: true,
    views: 203,
    excerpt: "A deep dive into creating smooth, interactive UI components using Framer Motion in React applications."
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const slug = params.slug

  const fetchPost = async () => {
    setIsLoading(true)
    try {
      // Fetch from Supabase directly
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single()
      
      if (error) {
        throw error
      }
      
      if (data) {
        setPost(data)
        
        // Record view after a short delay
        setTimeout(async () => {
          try {
            // Record view in Supabase
            await supabase
              .from('blog_stats')
              .upsert({
                post_id: data.id,
                views: (data.views || 0) + 1
              })
            
            // Update local post data with incremented view
            setPost(prev => prev ? {...prev, views: (prev.views || 0) + 1} : null)
          } catch (err) {
            console.error('Error recording view:', err)
          }
        }, 5000) // Wait 5 seconds before counting the view
      } else {
        // Fallback to sample data if not found in Supabase
        setPost(SAMPLE_POSTS[slug] || null)
      }
    } catch (error) {
      console.error('Error fetching blog post:', error)
      // Fallback to sample data if Supabase query fails
      setPost(SAMPLE_POSTS[slug] || null)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchPost()
    
    // Set up real-time subscription for post updates
    const subscription = supabase
      .channel(`post-${slug}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'blog_posts',
          filter: `slug=eq.${slug}`
        },
        (payload) => {
          // When the post is updated, refresh it
          fetchPost()
        }
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [slug])

  if (isLoading) {
    return (
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold mb-6 light-mode-text dark:text-white">Post Not Found</h1>
          <p className="text-lg mb-8 light-mode-text dark:text-gray-300">
            Sorry, the blog post you're looking for doesn't exist.
          </p>
          <Link href="/blog">
            <button className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
              Back to Blog
            </button>
          </Link>
        </div>
      </div>
    )
  }

  // Function to render markdown-like content
  const renderContent = (content: string) => {
    // Very basic markdown parsing for demonstration
    // In a real app, use a proper markdown parser like remark or marked
    const lines = content.split('\n')
    
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold my-6 light-mode-text dark:text-white">{line.substring(2)}</h1>
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-bold my-5 light-mode-text dark:text-white">{line.substring(3)}</h2>
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-bold my-4 light-mode-text dark:text-white">{line.substring(4)}</h3>
      }
      
      // Code blocks
      if (line.startsWith('```')) {
        return null // Skip code block markers
      }
      
      // Regular paragraph
      if (line.trim() !== '') {
        return <p key={index} className="my-4 light-mode-text dark:text-gray-300">{line}</p>
      }
      
      return null
    }).filter(Boolean)
  }

  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/blog" className="inline-flex items-center text-blue-500 hover:text-blue-600 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all posts
          </Link>
          
          <h1 className="text-4xl font-bold mb-4 light-mode-text dark:text-white">{post.title}</h1>
          
          <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 mb-8 gap-4">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              {post.author}
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              {post.views || 0} views
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Tag className="w-4 h-4 mr-1" />
              {post.tags.map(tag => (
                <Link 
                  href={`/blog?tag=${tag}`} 
                  key={tag}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="prose prose-lg max-w-none dark:prose-invert">
            {renderContent(post.content)}
          </div>
          
          {/* Comment Section */}
          <CommentSection postId={post.id} />
        </motion.div>
      </div>
    </section>
  )
}
