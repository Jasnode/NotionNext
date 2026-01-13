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
          .loader-container {
            position: relative;
            width: 300px;
            height: 300px;
            display: flex;
            justify-content: center;
            align-items: center;
            perspective: 1000px;
            will-change: transform;
          }
          .element {
            position: absolute;
            transform-style: preserve-3d;
            backface-visibility: hidden;
            will-change: transform, opacity;
          }
          .sphere-wrap {
            animation: spin 10s linear infinite;
          }
          .sphere {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 28%, #ffe1fb 0%, #ff9ff3 38%, #feca57 78%, #ffb142 100%);
            animation: sphereMotion 5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite alternate;
            box-shadow: 0 0 12px rgba(255, 105, 180, 0.45), 0 0 22px rgba(254, 202, 87, 0.18);
            will-change: transform, opacity;
          }
          .ripple {
            width: 120px;
            height: 120px;
            border: 5px solid rgba(84, 160, 255, 0.85);
            border-radius: 50%;
            position: absolute;
            animation: rippleEffect 2s linear infinite;
            opacity: 0.6;
            will-change: transform, opacity;
          }
          .cube {
            width: 60px;
            height: 60px;
            background: linear-gradient(45deg, #34ace0 0%, #ffda79 100%);
            transform: rotateX(45deg) rotateY(45deg);
            animation: rotateCube 3s ease-in-out infinite;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
          }
          .diamond-wrap {
            animation: bounceDiamond 1.5s ease-in-out infinite;
          }
          .diamond {
            width: 0;
            height: 0;
            border: 40px solid transparent;
            border-bottom-color: #ff6b6b;
            position: relative;
            animation: spinDiamond 6s linear infinite;
            box-shadow: 0 12px 22px rgba(255, 107, 107, 0.12);
          }
          .diamond:after {
            content: '';
            position: absolute;
            left: -40px;
            top: 40px;
            width: 0;
            height: 0;
            border: 40px solid transparent;
            border-top-color: #ff6b6b;
          }
          .particle {
            width: 4px;
            height: 4px;
            background-color: #ff9f43;
            border-radius: 50%;
            position: absolute;
            animation: particleMove 1.5s linear infinite;
            box-shadow: 0 0 10px rgba(255, 159, 67, 0.28);
          }
          .glow-text {
            position: absolute;
            bottom: -40px;
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(45deg, #ff6b6b, #feca57, #34ace0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
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
              transform: translate3d(0, 0, 50px) scale(1.2);
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
              transform: scale(0.8);
              opacity: 0.6;
            }
            50% {
              transform: scale(1.5);
              opacity: 0.2;
            }
            100% {
              transform: scale(2);
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
              opacity: 0.78;
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
              animation-duration: calc(var(--animation-duration, 1s) * 3);
              animation-timing-function: ease-out;
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