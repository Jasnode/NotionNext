'use client'
import { useGlobal } from '@/lib/global'
import { useEffect, useState } from 'react'
/**
 * @returns 加载动画
 * @author https://github.com/88lin/
 */
export default function LoadingCover() {
  const { onLoading, setOnLoading } = useGlobal()
  const [isVisible, setIsVisible] = useState(false) // 初始状态设置为false，避免服务端渲染与客户端渲染不一致
  const [isExiting, setIsExiting] = useState(false) // 新增退出中状态，用于播放淡出动画后再卸载

  useEffect(() => {
    if (onLoading) {
      setIsExiting(false)
      setIsVisible(true)
    } else if (isVisible) {
      setIsExiting(true)
    }
  }, [onLoading, isVisible])

  const handleClick = () => {
    setOnLoading(false) // 强行关闭 LoadingCover
  }

  const handleAnimationEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (isExiting && e?.animationName === 'fadeOut') {
      setIsVisible(false)
      setIsExiting(false)
    }
  }

  if (!isVisible && !isExiting) return null
  const animationClass =
    onLoading && !isExiting ? 'animate__fadeIn' : (isExiting ? 'animate__fadeOut' : '')

  return (
    <div
      id="loading-cover"
      onClick={handleClick}
      onAnimationEnd={handleAnimationEnd} // CHANGED: 监听动画结束以在淡出后卸载
      className={`dark:text-white text-black bg-white dark:bg-black animate__animated animate__faster ${animationClass} flex flex-col justify-center z-50 w-full h-screen fixed top-0 left-0`}
      role="status"
      aria-live="polite"
      aria-label="Loading overlay"
      aria-busy={onLoading}
    >
      <div className="mx-auto loader-container">
        <style jsx>{`
          :global(#loading-cover) {
            --c-ink: rgba(0, 0, 0, 0.28);
            --c-white: rgba(255, 255, 255, 0.92);
            --c-cyan: #56E6FF;
            --c-cyan2: #1FB6FF;
            --c-violet: #A855F7;
            --c-pink: #FF4FD8;
            --c-amber: #FFB86B;
            --glow-cyan: rgba(86, 230, 255, 0.18);
            --glow-violet: rgba(168, 85, 247, 0.16);
            --glow-pink: rgba(255, 79, 216, 0.12);
            background-image:
              radial-gradient(900px 520px at 50% 45%, rgba(31, 182, 255, 0.06), transparent 62%),
              radial-gradient(800px 480px at 44% 60%, rgba(168, 85, 247, 0.05), transparent 66%),
              radial-gradient(850px 520px at 58% 62%, rgba(255, 184, 107, 0.04), transparent 68%);
          }
          .loader-container {
            position: relative;
            width: 300px;
            height: 300px;
            display: flex;
            justify-content: center;
            align-items: center;
            perspective: 900px;
            will-change: transform;
          }
          .element {
            position: absolute;
            transform-style: preserve-3d;
            backface-visibility: hidden;
          }
          .sphere-wrap {
            animation: spin 10s linear infinite;
          }
          .sphere {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background:
              radial-gradient(circle at 30% 26%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.35) 18%, transparent 44%),
              radial-gradient(circle at 55% 60%, rgba(86, 230, 255, 0.85) 0%, rgba(168, 85, 247, 0.55) 42%, rgba(255, 79, 216, 0.30) 68%, transparent 78%),
              radial-gradient(circle at 50% 70%, rgba(0, 0, 0, 0.22), transparent 55%);
            animation: sphereMotion 4.2s cubic-bezier(0.55, -0.35, 0.25, 1.35) infinite alternate;
            box-shadow:
              0 0 0 1px rgba(255, 255, 255, 0.10) inset,
              0 0 26px var(--glow-cyan),
              0 0 28px var(--glow-violet),
              0 16px 38px rgba(0, 0, 0, 0.18);
            filter: saturate(1.05) contrast(1.03);
          }
          .ripple {
            width: 120px;
            height: 120px;
            border: 4px solid rgba(84, 184, 255, 0.85);
            border-radius: 50%;
            position: absolute;
            animation: rippleEffect 1.9s linear infinite;
            opacity: 0.6;
            box-shadow: 0 0 18px rgba(31, 182, 255, 0.14);
          }
          .cube {
            width: 60px;
            height: 60px;
            background: linear-gradient(
              135deg,
              rgba(31, 182, 255, 0.92) 0%,
              rgba(168, 85, 247, 0.75) 55%,
              rgba(255, 79, 216, 0.40) 100%
            );
            transform: rotateX(45deg) rotateY(45deg);
            animation: rotateCube 3s ease-in-out infinite;
            box-shadow:
              0 0 0 1px rgba(255, 255, 255, 0.10) inset,
              0 10px 22px rgba(0, 0, 0, 0.14);
            position: absolute;
            overflow: hidden;
          }
          .cube::after {
            content: '';
            position: absolute;
            inset: -30%;
            background: radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.35), transparent 55%);
            transform: rotate(18deg);
            opacity: 0.9;
            pointer-events: none;
          }
          .diamond-wrap {
            animation: bounceDiamond 1.5s ease-in-out infinite;
          }
          .diamond {
            width: 0;
            height: 0;
            border: 40px solid transparent;
            border-bottom-color: rgba(168, 85, 247, 0.92);
            position: relative;
            animation: spinDiamond 6s linear infinite;
            box-shadow: 0 12px 22px rgba(168, 85, 247, 0.12);
          }
          .diamond:after {
            content: '';
            position: absolute;
            left: -40px;
            top: 40px;
            width: 0;
            height: 0;
            border: 40px solid transparent;
            border-top-color: rgba(168, 85, 247, 0.92);
          }
          .particle {
            width: 4px;
            height: 4px;
            background-color: rgba(255, 184, 107, 0.95);
            border-radius: 50%;
            position: absolute;
            animation: particleMove 1.5s linear infinite;
            box-shadow: 0 0 12px rgba(255, 184, 107, 0.18);
          }
          .glow-text {
            position: absolute;
            bottom: -40px;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.2px;
            background: linear-gradient(90deg, var(--c-cyan), var(--c-violet), var(--c-amber));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 14px rgba(31, 182, 255, 0.10);
            animation: flicker 2.8s ease-in-out infinite alternate;
            user-select: none;
            pointer-events: none;
          }
          @keyframes sphereMotion {
            0%,
            100% {
              transform: translate3d(0, 0, 0) scale(1);
            }
            50% {
              transform: translate3d(0, 0, 44px) scale(1.18);
            }
          }
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
          @keyframes rippleEffect {
            0% {
              transform: scale(0.82);
              opacity: 0.65;
            }
            55% {
              transform: scale(1.55);
              opacity: 0.18;
            }
            100% {
              transform: scale(2.05);
              opacity: 0;
            }
          }
          @keyframes rotateCube {
            0%,
            100% {
              transform: rotateX(45deg) rotateY(45deg);
            }
            50% {
              transform: rotateX(225deg) rotateY(225deg);
            }
          }
          @keyframes bounceDiamond {
            0%,
            100% {
              transform: translate3d(0, -10px, 0);
            }
            50% {
              transform: translate3d(0, 10px, 0);
            }
          }
          @keyframes spinDiamond {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
          @keyframes particleMove {
            0% {
              transform: translate3d(0, 0, 0);
              opacity: 1;
            }
            100% {
              transform: translate3d(100px, 50px, 0);
              opacity: 0;
            }
          }
          @keyframes flicker {
            0%,
            100% {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
            50% {
              opacity: 0.82;
              transform: translate3d(0, -1px, 0);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .sphere-wrap,
            .sphere,
            .ripple,
            .cube,
            .diamond-wrap,
            .diamond,
            .particle,
            .glow-text {
              animation-duration: 3s !important;
              animation-timing-function: ease-out !important;
            }
          }
        `}</style>

        <div className="element sphere-wrap">
          <div className="sphere" />
        </div>
        <div className="element ripple"></div>
        <div className="element cube"></div>
        <div className="element diamond-wrap">
          <div className="diamond" />
        </div>
        <div className="element particle"></div>
        <div className="glow-text">Loading...</div>
      </div>
    </div>
  );
}