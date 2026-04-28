import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
  Settings, Loader2,
} from 'lucide-react'
import { formatDuration } from '@/lib/utils'

interface Props {
  src: string
  title?: string
  autoPlay?: boolean
  isLive?: boolean
  onError?: () => void
}

export default function VideoPlayer({ src, title, autoPlay = true, isLive = false, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>()

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [loading, setLoading] = useState(true)
  const [quality, setQuality] = useState('auto')
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [levels, setLevels] = useState<{ height: number; index: number }[]>([])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setLoading(true)

    if (Hls.isSupported() && src.includes('.m3u8')) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: isLive,
        backBufferLength: isLive ? 0 : 30,
      })
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels.map((l, i) => ({ height: l.height, index: i })))
        if (autoPlay) video.play().catch(() => {})
      })
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) onError?.()
      })
      hlsRef.current = hls
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      if (autoPlay) video.play().catch(() => {})
    } else {
      video.src = src
      if (autoPlay) video.play().catch(() => {})
    }

    return () => {
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  }, [src, autoPlay, isLive, onError])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      if (video.buffered.length > 0)
        setBuffered(video.buffered.end(video.buffered.length - 1))
    }
    const onDurationChange = () => setDuration(video.duration)
    const onWaiting = () => setLoading(true)
    const onCanPlay = () => setLoading(false)

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('durationchange', onDurationChange)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('canplay', onCanPlay)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('durationchange', onDurationChange)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('canplay', onCanPlay)
    }
  }, [])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (playing) v.pause()
    else v.play().catch(() => {})
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !muted
    setMuted(!muted)
  }

  const handleVolume = (val: number) => {
    const v = videoRef.current
    if (!v) return
    v.volume = val
    setVolume(val)
    if (val === 0) setMuted(true)
    else if (muted) { v.muted = false; setMuted(false) }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v || isLive) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    v.currentTime = pct * duration
  }

  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    if (!fullscreen) el.requestFullscreen?.()
    else document.exitFullscreen?.()
    setFullscreen(!fullscreen)
  }

  const setQualityLevel = (level: number) => {
    if (!hlsRef.current) return
    hlsRef.current.currentLevel = level
    setQuality(level === -1 ? 'auto' : `${levels.find((l) => l.index === level)?.height}p`)
    setShowQualityMenu(false)
  }

  const showControlsTemporarily = () => {
    setShowControls(true)
    clearTimeout(controlsTimer.current)
    controlsTimer.current = setTimeout(() => {
      if (playing) setShowControls(false)
    }, 3000)
  }

  return (
    <div
      ref={containerRef}
      className="video-container relative aspect-video w-full cursor-pointer select-none"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        muted={muted}
      />

      {/* Loading spinner */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40"
          >
            <Loader2 className="w-12 h-12 text-brand-400 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col justify-between p-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between">
              {title && (
                <h3 className="text-sm font-semibold text-white drop-shadow">{title}</h3>
              )}
              {isLive && (
                <div className="live-badge ml-auto">
                  <span className="dot-live" /> LIVE
                </div>
              )}
            </div>

            {/* Bottom controls */}
            <div
              className="bg-gradient-to-t from-black/80 to-transparent rounded-b-xl -mx-3 -mb-3 px-4 pb-3 pt-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress bar */}
              {!isLive && (
                <div
                  className="relative h-1 bg-white/20 rounded cursor-pointer mb-3 group/progress"
                  onClick={handleSeek}
                >
                  <div
                    className="absolute h-full bg-white/30 rounded"
                    style={{ width: `${duration ? (buffered / duration) * 100 : 0}%` }}
                  />
                  <div
                    className="absolute h-full bg-brand-500 rounded"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"
                    style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%`, transform: 'translate(-50%, -50%)' }}
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <button onClick={togglePlay} className="text-white hover:text-brand-400 transition-colors">
                  {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>

                {/* Volume */}
                <div className="flex items-center gap-2 group/vol">
                  <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                    {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={muted ? 0 : volume}
                    onChange={(e) => handleVolume(parseFloat(e.target.value))}
                    className="w-16 opacity-0 group-hover/vol:opacity-100 transition-opacity accent-brand-500"
                  />
                </div>

                {/* Time */}
                {!isLive && (
                  <span className="text-xs text-white/70 font-mono">
                    {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
                  </span>
                )}

                <div className="flex-1" />

                {/* Quality */}
                {levels.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowQualityMenu(!showQualityMenu)}
                      className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      {quality}
                    </button>
                    <AnimatePresence>
                      {showQualityMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute bottom-8 right-0 card py-1 min-w-24"
                        >
                          <button
                            onClick={() => setQualityLevel(-1)}
                            className="block w-full text-left px-3 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/10"
                          >
                            Auto
                          </button>
                          {levels.map((l) => (
                            <button
                              key={l.index}
                              onClick={() => setQualityLevel(l.index)}
                              className="block w-full text-left px-3 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/10"
                            >
                              {l.height}p
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
                  {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
