'use client'

type MatchMode = 'pvp' | 'bot' | null

interface ModeSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectMode: (mode: 'pvp' | 'bot') => void
}

export default function ModeSelectionModal({ isOpen, onClose, onSelectMode }: ModeSelectionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-lg max-w-md w-full p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-text">Choose Match Mode</h2>
          <p className="text-sm text-sub">Select how you want to compete</p>
        </div>

        {/* Mode options */}
        <div className="space-y-4 mb-8">
          {/* Quick Match (1v1) */}
          <button
            onClick={() => onSelectMode('pvp')}
            className="w-full text-left card p-6 hover:border-accent transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <span className="text-lg">⚔️</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text mb-1">Quick Match</h3>
                    <p className="text-xs text-sub">1v1 against a real player</p>
                  </div>
                </div>
                <p className="text-sm text-sub mt-3 leading-relaxed">
                  Match with another developer in real-time. First to solve wins.
                </p>
              </div>
            </div>
          </button>

          {/* Practice vs Bot */}
          <button
            onClick={() => onSelectMode('bot')}
            className="w-full text-left card p-6 hover:border-accent transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <span className="text-lg">🤖</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text mb-1">Practice vs Bot</h3>
                    <p className="text-xs text-sub">Solo practice mode</p>
                  </div>
                </div>
                <p className="text-sm text-sub mt-3 leading-relaxed">
                  Practice against an AI opponent. Perfect for learning and testing solutions.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Cancel button */}
        <button
          onClick={onClose}
          className="w-full btn-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

