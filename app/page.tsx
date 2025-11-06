"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Lock, Unlock, Terminal, Zap } from "lucide-react"
import { EncryptionPanel } from "@/components/encryption-panel"
import { DecryptionPanel } from "@/components/decryption-panel"

// Matrix rain effect component
const MatrixRain = () => {
  useEffect(() => {
    const canvas = document.getElementById('matrix') as HTMLCanvasElement
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}".split("")
    const fontSize = 10
    const columns = canvas.width / fontSize
    const drops: number[] = []

    for (let x = 0; x < columns; x++) {
      drops[x] = 1
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.fillStyle = '#0f0'
      ctx.font = fontSize + 'px monospace'

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 35)
    return () => clearInterval(interval)
  }, [])

  return <canvas id="matrix" className="fixed inset-0 pointer-events-none opacity-20" />
}

// Glitch text effect
const GlitchText = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const [glitch, setGlitch] = useState(false)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 100)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className={`${className} ${glitch ? 'animate-pulse' : ''}`} style={{
      textShadow: glitch ? '2px 0 #ff0000, -2px 0 #00ff00' : 'none'
    }}>
      {children}
    </span>
  )
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("encrypt")
  const [terminalText, setTerminalText] = useState("")
  
  useEffect(() => {
    const text = "INITIALIZING BYTELOCK PROTOCOL..."
    let i = 0
    const typeWriter = () => {
      if (i < text.length) {
        setTerminalText(text.substring(0, i + 1))
        i++
        setTimeout(typeWriter, 100)
      }
    }
    typeWriter()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900/20 relative overflow-hidden">
      <MatrixRain />
      
      <div className="relative z-10 p-4">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Shield className="h-12 w-12 text-green-400 mr-3 animate-pulse" />
                <div className="absolute inset-0 h-12 w-12 text-green-400 mr-3 animate-ping opacity-20">
                  <Shield className="h-12 w-12" />
                </div>
              </div>
              <GlitchText className="text-4xl font-bold text-green-400 font-mono">
                ByteLock
              </GlitchText>
            </div>
            <div className="text-green-300 font-mono mb-4">
              {"> "}{terminalText}<span className="animate-pulse">|</span>
            </div>
            <p className="text-lg text-green-200/80 max-w-2xl mx-auto font-mono">
              [CLASSIFIED] Military-grade encryption protocols. Zero data transmission. Maximum security.
            </p>
          </div>

          {/* Main Interface */}
          <div className="bg-black/60 backdrop-blur-sm border border-green-500/30 rounded-lg shadow-2xl shadow-green-500/10">
            <div className="border-b border-green-500/30 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-5 w-5 text-green-400" />
                <h2 className="text-2xl text-green-400 font-mono font-bold">CRYPTO_MODULE</h2>
              </div>
              <p className="text-green-200/70 font-mono text-sm">
                {"> "}SELECT OPERATION: ENCRYPT | DECRYPT
              </p>
            </div>
            
            <div className="p-6">
              {/* Custom Tabs */}
              <div className="flex mb-8">
                <button
                  onClick={() => setActiveTab("encrypt")}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-mono font-bold transition-all ${
                    activeTab === "encrypt"
                      ? "bg-green-500/20 text-green-300 border-b-2 border-green-400"
                      : "text-green-500/70 hover:text-green-400 hover:bg-green-500/10"
                  }`}
                >
                  <Lock className="h-4 w-4" />
                  ENCRYPT_MODE
                </button>
                <button
                  onClick={() => setActiveTab("decrypt")}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-mono font-bold transition-all ${
                    activeTab === "decrypt"
                      ? "bg-green-500/20 text-green-300 border-b-2 border-green-400"
                      : "text-green-500/70 hover:text-green-400 hover:bg-green-500/10"
                  }`}
                >
                  <Unlock className="h-4 w-4" />
                  DECRYPT_MODE
                </button>
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {activeTab === "encrypt" && <EncryptionPanel />}
                {activeTab === "decrypt" && <DecryptionPanel />}
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/30 rounded-lg backdrop-blur-sm">
              <Zap className="h-4 w-4 text-green-400 animate-pulse" />
              <span className="text-sm text-green-300 font-mono font-bold">
                [SECURE] CLIENT-SIDE ONLY • NO_DATA_TRANSMISSION • ZERO_TRUST_PROTOCOL
              </span>
            </div>
          </div>

          {/* Terminal Footer */}
          <div className="mt-8 bg-black/80 border border-green-500/30 rounded p-4 font-mono text-xs text-green-400">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>SYSTEM_STATUS: OPERATIONAL</span>
            </div>
            <div className="text-green-500/70">
              {"> "}CONNECTION: SECURE_TUNNEL_ESTABLISHED<br/>
              {"> "}ENCRYPTION: AES-256_ACTIVATED<br/>
              {"> "}PRIVACY_MODE: MAXIMUM_STEALTH
            </div>
          </div>
          
          {/* Made By Attribution */}
          <div className="mt-4 text-center">
            <a 
              href="https://www.linkedin.com/in/abhinav-gupta-4tech/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              <span>{">"} MADE BY ABHINAV</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
