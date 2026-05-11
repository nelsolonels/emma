import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { X, Check, Camera, Star, Trash2, Calendar } from 'lucide-react'
import NoteModal from './NoteModal'
import toast from 'react-hot-toast'

function useCountryPhoto(nameEn, name) {
  const [photo, setPhoto] = useState(null)

  useEffect(() => {
    setPhoto(null)
    const query = nameEn || name
    if (!query) return
    let cancelled = false
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => {
        if (!cancelled && d.originalimage?.source) setPhoto(d.originalimage.source)
        else if (!cancelled && d.thumbnail?.source) setPhoto(d.thumbnail.source)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [nameEn, name])

  return photo
}

export default function CountrySheet({ country, isVisited, notes, onClose, onToggleVisited, onAddNote, onDeleteNote }) {
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const photo = useCountryPhoto(country.nameEn, country.name)

  const handleSaveNote = (note) => {
    onAddNote(note)
    setShowNoteModal(false)
    toast.success('Souvenir sauvegardé ✨')
  }

  const handleDelete = (noteId) => {
    onDeleteNote(noteId)
    if (selected?.id === noteId) setSelected(null)
    toast.success('Souvenir supprimé')
  }

  return (
    <>
      {/* Tap-outside to close */}
      <motion.div
        className="fixed inset-0 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-30 flex flex-col rounded-t-2xl shadow-2xl overflow-hidden"
        style={{ background: '#0a1628', borderTop: '1px solid #1a2d4a', maxHeight: '78vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Country photo header */}
        <div className="relative flex-shrink-0 h-44 bg-[#0d1b2a]">
          {photo ? (
            <motion.img
              src={photo}
              alt={country.name}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          ) : (
            <div className="w-full h-full animate-pulse" style={{ background: 'linear-gradient(135deg, #0d1b2a 0%, #132236 100%)' }} />
          )}

          {/* Dark gradient overlay */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0a1628 0%, transparent 60%)' }} />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#fff' }}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Drag handle */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2">
            <div className="w-10 h-1 rounded-full bg-white/30" />
          </div>

          {/* Country name + visited toggle overlaid on photo */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-white font-bold text-2xl drop-shadow-lg">{country.name}</h2>
              {notes.length > 0 && (
                <p className="text-white/60 text-xs mt-0.5">{notes.length} souvenir{notes.length > 1 ? 's' : ''}</p>
              )}
            </div>
            <button
              onClick={() => {
                onToggleVisited()
                toast.success(isVisited ? 'Retiré des pays visités' : `${country.name} ajouté !`)
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0 shadow-lg ${
                isVisited
                  ? 'bg-amber-400 text-[#050b14]'
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isVisited ? 'Visité' : 'Marquer'}</span>
            </button>
          </div>
        </div>

        {/* Add note button */}
        <div className="px-5 py-4 flex-shrink-0 border-b border-[#1a2d4a]">
          <button
            onClick={() => setShowNoteModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.25)', color: '#2dd4bf' }}
          >
            <Camera className="w-4 h-4" />
            Ajouter un souvenir
          </button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto custom-scroll px-5 py-4 min-h-0">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-600">
              <Camera className="w-9 h-9 mb-2 opacity-25" />
              <p className="text-sm">Aucun souvenir pour {country.name}</p>
              <p className="text-xs mt-1 opacity-60">Appuie sur le bouton ci-dessus pour en ajouter un</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map(note => (
                <NoteRow
                  key={note.id}
                  note={note}
                  isSelected={selected?.id === note.id}
                  onClick={() => setSelected(n => n?.id === note.id ? null : note)}
                  onDelete={() => handleDelete(note.id)}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Note Modal */}
      {createPortal(
        <AnimatePresence>
          {showNoteModal && (
            <NoteModal
              initialCity={country.name}
              onSave={handleSaveNote}
              onClose={() => setShowNoteModal(false)}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Note Detail */}
      {createPortal(
        <AnimatePresence>
          {selected && (
            <NoteDetail
              note={selected}
              onClose={() => setSelected(null)}
              onDelete={() => handleDelete(selected.id)}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

function NoteRow({ note, isSelected, onClick, onDelete }) {
  return (
    <motion.div
      layout
      onClick={onClick}
      className="group rounded-xl cursor-pointer overflow-hidden transition-all"
      style={{
        border: isSelected ? '1px solid rgba(45,212,191,0.35)' : '1px solid #1a2d4a',
        background: isSelected ? 'rgba(45,212,191,0.04)' : 'rgba(10,22,40,0.6)',
      }}
    >
      {note.photos?.[0] && (
        <div className="h-28 overflow-hidden">
          <img src={note.photos[0]} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{note.cityName}</p>
          {note.visitedAt && (
            <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(note.visitedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
          {note.rating > 0 && (
            <div className="flex gap-0.5 mt-1.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-3 h-3 ${s <= note.rating ? 'text-amber-400 fill-amber-400' : 'text-[#1a2d4a]'}`} />
              ))}
            </div>
          )}
          {note.content && <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">{note.content}</p>}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

function NoteDetail({ note, onClose, onDelete }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        className="relative w-full sm:max-w-lg overflow-y-auto custom-scroll rounded-t-2xl sm:rounded-2xl sm:mb-4 shadow-2xl"
        style={{ background: '#0a1628', border: '1px solid #1a2d4a', maxHeight: '85vh' }}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-[#1a2d4a]" />
        </div>

        {note.photos?.length > 0 && (
          <div className={`grid gap-1 ${note.photos.length === 1 ? '' : 'grid-cols-2'}`}>
            {note.photos.slice(0, 4).map((photo, i) => (
              <div key={i} className={`overflow-hidden ${
                note.photos.length === 1 ? 'h-56 rounded-t-2xl' :
                i === 0 && note.photos.length >= 3 ? 'col-span-2 h-40 rounded-t-2xl' : 'h-32'
              } ${i === 0 && note.photos.length < 3 ? 'rounded-tl-2xl' : ''} ${i === 1 && note.photos.length < 3 ? 'rounded-tr-2xl' : ''}`}>
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-white text-xl font-bold">{note.cityName}</h2>
              {note.visitedAt && (
                <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(note.visitedAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={onDelete} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors text-slate-400 hover:text-white" style={{ background: '#132236' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {note.rating > 0 && (
            <div className="flex gap-1 mb-4">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-5 h-5 ${s <= note.rating ? 'text-amber-400 fill-amber-400' : 'text-[#1a2d4a]'}`} />
              ))}
            </div>
          )}

          {note.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {note.tags.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgba(45,212,191,0.08)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.2)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {note.content && (
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
