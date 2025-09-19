"use client"

import React, { useState, useRef } from 'react'
import { X, Upload, Link, Globe, Image as ImageIcon } from 'lucide-react'
import { uploadImage } from '@/lib/supabase'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  onInsertImage: (src: string, alt?: string, caption?: string, captionPosition?: 'above' | 'below', alignment?: 'left' | 'center' | 'right', fullScreen?: boolean) => void
  editMode?: boolean
  initialData?: {
    src: string
    alt?: string
    caption?: string
    captionPosition?: 'above' | 'below'
    alignment?: 'left' | 'center' | 'right'
    fullScreen?: boolean
  }
}

export function ImageModal({ isOpen, onClose, onInsertImage, editMode = false, initialData }: ImageModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload')
  const [imageUrl, setImageUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [caption, setCaption] = useState('')
  const [captionPosition, setCaptionPosition] = useState<'above' | 'below'>('below')
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left')
  const [fullScreen, setFullScreen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize form with existing data when in edit mode
  React.useEffect(() => {
    if (editMode && initialData) {
      setImageUrl(initialData.src || '')
      setAltText(initialData.alt || '')
      setCaption(initialData.caption || '')
      setCaptionPosition(initialData.captionPosition || 'below')
      setAlignment(initialData.alignment || 'left')
      setFullScreen(initialData.fullScreen || false)
      setImagePreview(initialData.src || null)
    } else if (!editMode) {
      // Reset form for new image
      setImageUrl('')
      setAltText('')
      setCaption('')
      setCaptionPosition('below')
      setAlignment('left')
      setFullScreen(false)
      setImagePreview(null)
    }
  }, [editMode, initialData, isOpen])

  console.log('ImageModal render - isOpen:', isOpen)

  if (!isOpen) return null

  const handleFileUpload = async (file: File) => {
    console.log('handleFileUpload called with file:', file?.name, file?.type)
    if (file && file.type.startsWith('image/')) {
      console.log('File is valid image, starting upload process')
      setIsLoading(true)
      try {
        // Upload to Supabase Storage and get URL
        console.log('Calling uploadImage function...')
        const imageUrl = await uploadImage(file)
        console.log('Upload successful, setting preview:', imageUrl)
        setImagePreview(imageUrl)
        setAltText(altText || file.name.replace(/\.[^/.]+$/, ""))
      } catch (error) {
        console.error('Failed to upload image:', error)
        alert('Failed to upload image. Please try again.')
      } finally {
        setIsLoading(false)
      }
    } else {
      console.log('File is not a valid image or is null')
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      await handleFileUpload(files[0])
    }
  }

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      setIsLoading(true)
      // Test if URL is valid by creating an image element
      const img = new Image()
      img.onload = () => {
        setImagePreview(imageUrl.trim())
        setIsLoading(false)
      }
      img.onerror = () => {
        setIsLoading(false)
        alert('Invalid image URL. Please check the URL and try again.')
      }
      img.src = imageUrl.trim()
    }
  }

  const handleSubmit = () => {
    const src = imagePreview || imageUrl
    if (src) {
      onInsertImage(src, altText, caption, captionPosition, alignment, fullScreen)
      onClose()
      setImageUrl('')
      setActiveTab('upload')
    } else {
      console.log('Missing required data - imagePreview:', !!imagePreview, 'altText:', altText)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 border-2 border-amber-200 dark:border-amber-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-200 dark:border-amber-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-amber-600" />
            {editMode ? 'Edit Image' : 'Add Image'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs - Hide in edit mode since we already have the image */}
        {!editMode && (
          <div className="flex border-b border-amber-200 dark:border-amber-700">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-b-2 border-amber-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'url'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-b-2 border-amber-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              From URL
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {(editMode || activeTab === 'upload') ? (
            <div className="space-y-4">
              {!imagePreview ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-amber-300 dark:hover:border-amber-600'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {isLoading ? (
                    <div className="animate-spin w-12 h-12 mx-auto mb-4 border-4 border-amber-500 border-t-transparent rounded-full"></div>
                  ) : (
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  )}
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {isLoading ? 'Uploading to storage...' : 'Drag & drop an image here, or'}
                  </p>
                  {!isLoading && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                    >
                      Choose File
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) await handleFileUpload(file)
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-48 object-contain rounded-xl border border-gray-200 dark:border-gray-600"
                    />
                    <button
                      onClick={() => {
                        setImagePreview(null)
                        if (!editMode) {
                          setAltText('')
                          setImageUrl('')
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                      title={editMode ? "Replace image" : "Remove image"}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {editMode && !imagePreview && (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                      Click "Choose File" below to select a new image
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-gray-100"
                    onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  />
                  <button
                    onClick={handleUrlSubmit}
                    disabled={!imageUrl.trim() || isLoading}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-xl transition-colors"
                  >
                    {isLoading ? '...' : 'Preview'}
                  </button>
                </div>
              </div>
              
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-48 object-contain rounded-xl border border-gray-200 dark:border-gray-600"
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null)
                      setImageUrl('')
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Alt Text {imagePreview ? '(Required)' : '(Optional)'}
              </label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe the image for accessibility..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Banner Caption (Optional)
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a banner caption for the image..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-gray-100"
              />
              {caption && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Caption Position
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCaptionPosition('above')}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                        captionPosition === 'above'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Above Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaptionPosition('below')}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                        captionPosition === 'below'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Below Image
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Alignment
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAlignment('left')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                    alignment === 'left'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Left
                </button>
                <button
                  type="button"
                  onClick={() => setAlignment('center')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                    alignment === 'center'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Center
                </button>
                <button
                  type="button"
                  onClick={() => setAlignment('right')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                    alignment === 'right'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Right
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Options
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFullScreen(!fullScreen)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                    fullScreen
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Full Screen
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-amber-200 dark:border-amber-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!imagePreview && !imageUrl.trim()}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
          >
            {editMode ? 'Update Image' : 'Insert Image'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface URLEmbedModalProps {
  isOpen: boolean
  onClose: () => void
  onInsertEmbed: (url: string) => void
}

export function URLEmbedModal({ isOpen, onClose, onInsertEmbed }: URLEmbedModalProps) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [previewData, setPreviewData] = useState<{
    title?: string
    description?: string
    image?: string
    domain?: string
  } | null>(null)

  if (!isOpen) return null

  const fetchPreview = async (urlToFetch: string) => {
    setIsLoading(true)
    try {
      // Simple URL validation
      const urlObj = new URL(urlToFetch)
      setPreviewData({
        title: `Link to ${urlObj.hostname}`,
        description: urlToFetch,
        domain: urlObj.hostname,
        image: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
      })
    } catch (error) {
      alert('Please enter a valid URL')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = () => {
    if (url.trim()) {
      if (!previewData) {
        fetchPreview(url.trim())
      } else {
        onInsertEmbed(url.trim())
        onClose()
        setUrl('')
        setPreviewData(null)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 border-2 border-purple-200 dark:border-purple-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-200 dark:border-purple-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Globe className="w-6 h-6 text-purple-600" />
            Embed URL
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="https://example.com"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
                  autoFocus
                />
                {!previewData && (
                  <button
                    onClick={() => fetchPreview(url)}
                    disabled={!url.trim() || isLoading}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-xl transition-colors"
                  >
                    {isLoading ? '...' : 'Preview'}
                  </button>
                )}
              </div>
            </div>
            
            {previewData && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-start gap-3">
                  <img
                    src={previewData.image}
                    alt="Favicon"
                    className="w-8 h-8 rounded flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {previewData.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {previewData.domain}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                      {previewData.description}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setPreviewData(null)
                      setUrl('')
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {previewData 
                ? 'Preview looks good? Click "Create Embed" to insert it into your post.'
                : 'Enter a URL and click Preview to see how it will look as an embed card.'
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-purple-200 dark:border-purple-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!url.trim()}
            className="px-6 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
          >
            {previewData ? 'Create Embed' : 'Preview URL'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface LinkModalProps {
  isOpen: boolean
  onClose: () => void
  onInsertLink: (url: string, text?: string) => void
}

export function LinkModal({ isOpen, onClose, onInsertLink }: LinkModalProps) {
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')

  if (!isOpen) return null

  const handleSubmit = () => {
    if (url.trim()) {
      onInsertLink(url.trim(), text.trim() || undefined)
      onClose()
      setUrl('')
      setText('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 border-2 border-blue-200 dark:border-blue-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-200 dark:border-blue-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Link className="w-6 h-6 text-blue-600" />
            Add Link
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Link Text (Optional)
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Leave empty to use URL"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-blue-200 dark:border-blue-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!url.trim()}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
          >
            Add Link
          </button>
        </div>
      </div>
    </div>
  )
}
