import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Camera, Star, Tag, Calendar, MapPin, Upload, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

const TAGS = [
  { id: 'food', label: '🍜 Cuisine', },
  { id: 'nature', label: '🌿 Nature' },
  { id: 'culture', label: '🏛️ Culture' },
  { id: 'histoire', label: '📜 Histoire' },
  { id: 'nightlife', label: '🎶 Nuit' },
  { id: 'art', label: '🎨 Art' },
  { id: 'plage', label: '🏖️ Plage' },
  { id: 'montagne', label: '⛰️ Montagne' },
  { id: 'city', label: '🏙️ Ville' },
  { id: 'aventure', label: '🏕️ Aventure' },
  { id: 'shopping', label: '🛍️ Shopping' },
  { id: 'sport', label: '⚽ Sport' },
]

export default function NoteModal({ initialCity = '', location, onSave, onClose }) {
  const [cityName, setCityName] = useState(initialCity)
  const [visitedAt, setVisitedAt] = useState(new Date().toISOString().split('T')[0])
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState([])
  const [photos, setPhotos] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const handleFiles = (files) => {
    const toProcess = Array.from(files).slice(0, 5 - photos.length)
    toProcess.forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = ev => setPhotos(prev => [...prev, ev.target.result])
      reader.readAsDataURL(file)
    })
  }

  const toggleTag = tag =>
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )

  const handleSave = () => {
    if (!cityName.trim()) return
    onSave({
      id: uuidv4(),
      cityName: cityName.trim(),
      visitedAt,
      content,
      rating,
      tags: selectedTags,
      photos,
      lat: location?.lat,
      lng: location?.lng,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-navy-700 border border-navy-500 rounded-2xl shadow-2xl custom-scroll"
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 24 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-navy-500 bg-navy-700/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-400/10 border border-teal-400/30 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-teal-400" />
            </div>
            <h2 className="text-white font-semibold text-lg">Ajouter un souvenir</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-navy-600 hover:bg-navy-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* City */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-teal-400" /> Lieu
            </label>
            <input
              value={cityName}
              onChange={e => setCityName(e.target.value)}
              placeholder="Paris, Tour Eiffel..."
              autoFocus
              className="form-input"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-teal-400" /> Date du voyage
            </label>
            <input
              type="date"
              value={visitedAt}
              onChange={e => setVisitedAt(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Rating */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Note
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s === rating ? 0 : s)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      s <= (hoverRating || rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-navy-500'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <button
                  onClick={() => setRating(0)}
                  className="ml-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  effacer
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-teal-400" /> Catégories
            </label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedTags.includes(tag.id)
                      ? 'bg-teal-400/20 text-teal-300 border border-teal-400/40'
                      : 'bg-navy-600 text-slate-400 border border-navy-500 hover:border-navy-400'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Notes &amp; impressions
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Qu'as-tu vu, mangé, ressenti ? Raconte ton expérience..."
              rows={4}
              className="form-input resize-none"
            />
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Camera className="w-3.5 h-3.5 text-teal-400" /> Photos ({photos.length}/5)
            </label>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden aspect-square">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <button
                    onClick={() => fileRef.current.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-navy-500 hover:border-teal-400/50 flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-teal-400 transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-xs">Ajouter</span>
                  </button>
                )}
              </div>
            )}

            {photos.length === 0 && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                onClick={() => fileRef.current.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-teal-400/60 bg-teal-400/5 text-teal-400'
                    : 'border-navy-500 hover:border-teal-400/40 text-slate-600 hover:text-slate-400'
                }`}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Glisse des photos ici ou clique pour parcourir</p>
                <p className="text-xs mt-1 opacity-50">JPG, PNG, WEBP · Max 5 photos</p>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={e => handleFiles(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 px-6 py-4 border-t border-navy-500 bg-navy-700/95 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-navy-600 hover:bg-navy-500 text-slate-300 text-sm font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!cityName.trim()}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-navy-800 text-sm font-semibold transition-all shadow-lg shadow-amber-900/30"
          >
            Sauvegarder
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
