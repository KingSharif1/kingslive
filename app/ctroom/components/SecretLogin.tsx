"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Lock, Unlock, Eye, EyeOff, Fingerprint, KeyRound, Sparkles } from 'lucide-react'

interface SecretLoginProps {
  onSuccess: (user: any) => void
  onError: (error: string) => void
}

export default function SecretLogin({ onSuccess, onError }: SecretLoginProps) {
  const [passphrase, setPassphrase] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passphrase.trim()) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/passphrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase: passphrase.trim() }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsUnlocking(true)
        // Play unlock animation then call success
        setTimeout(() => {
          onSuccess(data.user)
        }, 1500)
      } else {
        setShake(true)
        setTimeout(() => setShake(false), 500)
        onError(data.error || 'Invalid passphrase')
        setPassphrase('')
      }
    } catch (error) {
      onError('Connection failed')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20" />

      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-2xl blur-xl opacity-30 animate-pulse" />
        
        {/* Card */}
        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="relative bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl"
        >
          {/* Lock icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={isUnlocking ? { rotateY: 180 } : {}}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
                <AnimatePresence mode="wait">
                  {isUnlocking ? (
                    <motion.div
                      key="unlocked"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-green-400"
                    >
                      <Unlock className="w-10 h-10" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="locked"
                      initial={{ scale: 1 }}
                      exit={{ scale: 0, rotate: 180 }}
                      className="text-blue-400"
                    >
                      <Shield className="w-10 h-10" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Scanning ring animation */}
              {isLoading && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-blue-500"
                  animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <motion.h1 
              className="text-2xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {isUnlocking ? (
                <span className="text-green-400">Access Granted</span>
              ) : (
                <>Control Room</>
              )}
            </motion.h1>
            <motion.p 
              className="text-gray-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {isUnlocking ? (
                <span className="text-green-400/80">Welcome back, Commander</span>
              ) : (
                <>Enter the secret handshake</>
              )}
            </motion.p>
          </div>

          {/* Form */}
          {!isUnlocking && (
            <motion.form 
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  ref={inputRef}
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter passphrase..."
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={isLoading}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Fingerprint className="w-5 h-5" />
                    </motion.div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Authenticate</span>
                  </>
                )}
              </motion.button>
            </motion.form>
          )}

          {/* Success animation */}
          {isUnlocking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-green-400" />
              </motion.div>
            </motion.div>
          )}

          {/* Footer hint */}
          {!isUnlocking && (
            <motion.p 
              className="text-center text-gray-600 text-xs mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              🤫 Only those who know the secret may enter
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
