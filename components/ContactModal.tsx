'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'

export default function ContactModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to send message.')
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('Failed to send message. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#fdfaf6] rounded-md w-full max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#fdfaf6] px-6 py-4 border-b border-[#e4d9ca] flex justify-between items-start">
          <div className="flex-1">
            <div className="font-mono text-xs tracking-widest text-[#8a7a6a] mb-1">GET IN TOUCH</div>
            <h2 className="text-2xl font-serif text-[#16120e]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Contact Us
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#8a7a6a] hover:text-[#16120e] text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-50 rounded-full mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-[#16120e] text-sm leading-relaxed">
                Message sent! We'll get back to you at{' '}
                <span className="font-semibold">{formData.email}</span> within one business day.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-mono tracking-widest text-[#8a7a6a] mb-1">
                  FULL NAME
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#e4d9ca] rounded text-[#16120e] text-sm focus:outline-none focus:ring-1 focus:ring-[#e8a020]"
                  placeholder="Your name"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-mono tracking-widest text-[#8a7a6a] mb-1">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#e4d9ca] rounded text-[#16120e] text-sm focus:outline-none focus:ring-1 focus:ring-[#e8a020]"
                  placeholder="your@email.com"
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-mono tracking-widest text-[#8a7a6a] mb-1">
                  SUBJECT
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#e4d9ca] rounded text-[#16120e] text-sm focus:outline-none focus:ring-1 focus:ring-[#e8a020]"
                  required
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Billing Question">Billing Question</option>
                  <option value="Team / Corporate Licensing">Team / Corporate Licensing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-mono tracking-widest text-[#8a7a6a] mb-1">
                  MESSAGE
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-3 py-2 bg-white border border-[#e4d9ca] rounded text-[#16120e] text-sm focus:outline-none focus:ring-1 focus:ring-[#e8a020] resize-none"
                  placeholder="Tell us how we can help..."
                  required
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 text-red-600 text-sm">
                  <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-[#e8a020] hover:bg-[#d68f1a] disabled:opacity-75 text-white text-sm font-serif rounded transition-colors"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {loading ? 'Sending…' : 'Send Message →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
