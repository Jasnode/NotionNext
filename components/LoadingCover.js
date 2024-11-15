import { useGlobal } from '@/lib/global'
import { useEffect, useState } from 'react'
/**
 * @returns 加载动画
 * @author https://github.com/88lin/
 */
export default function LoadingCover() {
  const { onLoading, setOnLoading } = useGlobal()
  const [isVisible, setIsVisible] = useState(false) // 初始状态设置为false，避免服务端渲染与客户端渲染不一致

  useEffect(() => {
    // 确保在客户端渲染时才设置可见性
    if (onLoading) {
      setIsVisible(true)
    } else {
      const timeout = setTimeout(() => setIsVisible(false), 1800) // 等待淡出动画结束
      return () => clearTimeout(timeout)
    }
  }, [onLoading])

  const handleClick = () => {
    setOnLoading(false) // 强行关闭 LoadingCover
  }

  if (typeof window === 'undefined') {
    return null // 避免在服务端渲染时渲染出这个组件
  }

  return isVisible ? (
    <div
      id="loading-cover"
      onClick={handleClick}
      className={`dark:text-white text-black bg-white dark:bg-black animate__animated animate__faster ${
        onLoading ? 'animate__fadeIn' : (isVisible ? '' : 'animate__fadeOut')
      } flex flex-col justify-center z-50 w-full h-screen fixed top-0 left-0`}
      >
        <div className="mx-auto loader-container">
          <style jsx global>{`
            .loader-container {
              position: relative;
              width: 300px;
              height: 300px;
              display: flex;
              justify-content: center;
              align-items: center;
              perspective: 1000px;
            }
            .element {
              position: absolute;
              transform-style: preserve-3d;
              backface-visibility: hidden;
            }
            .sphere {
              width: 120px;
              height: 120px;
              border-radius: 50%;
              background: radial-gradient(circle, #ff9ff3, #feca57);
              animation: sphereMotion 5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite alternate, spin 10s linear infinite;
              box-shadow: 0 0 15px rgba(255, 105, 180, 0.6);
            }
            .ripple {
              width: 120px;
              height: 120px;
              border: 5px solid #54a0ff;
              border-radius: 50%;
              position: absolute;
              animation: rippleEffect 2s linear infinite;
              opacity: 0.6;
            }
            .cube {
              width: 60px;
              height: 60px;
              background: linear-gradient(45deg, #34ace0, #ffda79);
              transform: rotateX(45deg) rotateY(45deg);
              animation: rotateCube 3s ease-in-out infinite;
            }
            .diamond {
              width: 0;
              height: 0;
              border: 40px solid transparent;
              border-bottom-color: #ff6b6b;
              position: relative;
              animation: bounceDiamond 1.5s ease-in-out infinite, spinDiamond 6s linear infinite;
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
            }
            .glow-text {
              position: absolute;
              bottom: -40px;
              font-size: 24px;
              font-weight: bold;
              background: linear-gradient(45deg, #ff6b6b, #feca57, #34ace0);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              animation: flicker 3s infinite alternate;
            }
            @keyframes sphereMotion {
              0%, 100% { transform: translateZ(0) scale(1); }
              50% { transform: translateZ(50px) scale(1.2); }
            }
            @keyframes rippleEffect {
              0% { transform: scale(0.8); opacity: 0.6; }
              50% { transform: scale(1.5); opacity: 0.2; }
              100% { transform: scale(2); opacity: 0; }
            }
            @keyframes rotateCube {
              0%, 100% { transform: rotateX(45deg) rotateY(45deg); }
              50% { transform: rotateX(225deg) rotateY(225deg); }
            }
            @keyframes bounceDiamond {
              0%, 100% { transform: translateY(-10px); }
              50% { transform: translateY(10px); }
            }
            @keyframes spinDiamond {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes particleMove {
              0% { transform: translate(0, 0); opacity: 1; }
              100% { transform: translate(100px, 50px); opacity: 0; }
            }
            @keyframes flicker {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
          `}</style>
          <div className="element sphere"></div>
          <div className="element ripple"></div>
          <div className="element cube"></div>
          <div className="element diamond"></div>
          <div className="element particle"></div>
          <div className="glow-text">Loading...</div>
        </div>
      </div>
    ) : null;
}