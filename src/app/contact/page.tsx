'use client';

import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { PaperPlaneTilt, Robot, User, Envelope, ChatCircle, SpinnerGap } from '@phosphor-icons/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const initialMessage: Message = {
  role: 'assistant',
  content: "Hi! I'm Thesis Generator's support assistant. I can help answer questions about our service, features, pricing, and more. How can I help you today?",
};

export default function ContactPage() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I apologize, but I'm having trouble connecting right now. Please email us directly at hello@thesisgenerator.tech and we'll get back to you within 24 hours.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Contact Us</h1>
            <p className="text-xl text-slate-600">
              Chat with our AI assistant or reach out via email
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* AI Chat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-[600px] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-800 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Robot size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold">Thesis Generator Support</h3>
                      <p className="text-sm text-slate-300">AI-Powered Assistant</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                            <Robot size={16} className="text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-slate-700 text-white rounded-br-md'
                              : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <User size={16} className="text-slate-600" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                        <Robot size={16} className="text-white" />
                      </div>
                      <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-md">
                        <SpinnerGap size={20} className="animate-spin text-slate-500" />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-slate-200 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type your question..."
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                    <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                      <PaperPlaneTilt size={16} />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    Can&apos;t find what you need? Email us at hello@thesisgenerator.tech
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Envelope size={24} className="text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Email Support</h3>
                    <p className="text-slate-600 mb-2">
                      For detailed inquiries or issues the AI can&apos;t resolve
                    </p>
                    <a
                      href="mailto:hello@thesisgenerator.tech"
                      className="text-slate-700 hover:underline font-medium"
                    >
                      hello@thesisgenerator.tech
                    </a>
                    <p className="text-sm text-slate-500 mt-1">Response within 24 hours</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <ChatCircle size={24} className="text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">AI Chat Support</h3>
                    <p className="text-slate-600 mb-2">
                      Get instant answers to common questions about Thesis Generator
                    </p>
                    <ul className="text-sm text-slate-500 space-y-1">
                      <li>• Features and capabilities</li>
                      <li>• Pricing and subscriptions</li>
                      <li>• How to use the platform</li>
                      <li>• Technical questions</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-slate-800 text-white">
                <h3 className="font-semibold mb-2">Need Immediate Help?</h3>
                <p className="text-slate-300 mb-4">
                  Our AI assistant is trained to answer most questions instantly. If it can&apos;t help, it will guide you to email us for personal support.
                </p>
                <p className="text-sm text-slate-400">
                  Available 24/7 • Instant responses • Always learning
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
