/* eslint-disable react/no-unknown-property */
/**
 * 此处样式只对当前主题生效
 * 此处不支持tailwindCSS的 @apply 语法
 * @returns
 */
const Style = () => {
  return (
    <style jsx global>{`
      :root {
        --ai-bg: #f7f7f9;
        --ai-title: #425AEF;
        --ai-title-text: #fff;
        --ai-card-bg: #fff;
        --ai-card-border: #e3e8f7;
        --heo-surface-strong: #ffffff;
        --heo-surface-dark: #070B14;
        --heo-text: rgba(0, 0, 0, 0.88);
      }
        
      .dark {
        --ai-bg: #21232a;
        --ai-title: #f2b94b;
        --ai-title-text: #1b1c20;
        --ai-card-bg: #1d1e22;
        --ai-card-border: #3d3d3f;
      }

      html.dark {
        --heo-text: rgba(255, 255, 255, 0.88);
      }

      * {
        box-sizing: border-box;
      }

      body {
        background-color: #f7f9fe;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(60, 60, 67, 0.4);
        border-radius: 8px;
        cursor: pointer;
      }

      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      .recent-top-post-group::-webkit-scrollbar,
      .scroll-hidden::-webkit-scrollbar {
        display: none;
      }

      /* 公告栏中的字体固定白色 */
      #theme-heo #announcement-content .notion {
        color: white;
      }

      #more {
        white-space: nowrap;
      }

      #theme-heo #card-body.today-card {
        background: #ffffff;
        border: 1px solid #e3e8f7;
        border-radius: 12px;
        box-shadow: none;
      }

      #theme-heo #card-body.today-card:hover #today-card-cover {
        transform: scale(1.02);
      }

      #theme-heo #today-card-cover.today-card-cover {
        z-index: 0;
        pointer-events: none;
        background:
          linear-gradient(
            90deg,
            rgba(224, 245, 240, 0.85) 0%,
            rgba(226, 245, 242, 0.85) 5%,
            rgba(228, 245, 244, 0.85) 10%,
            rgba(230, 245, 246, 0.85) 15%,
            rgba(232, 245, 248, 0.85) 20%,
            rgba(234, 245, 250, 0.85) 25%,
            rgba(236, 245, 252, 0.85) 30%,
            rgba(238, 245, 254, 0.85) 35%,
            rgba(240, 245, 255, 0.85) 40%,
            rgba(242, 245, 255, 0.85) 45%,
            rgba(244, 245, 255, 0.85) 50%,
            rgba(246, 245, 255, 0.85) 55%,
            rgba(248, 245, 255, 0.85) 60%,
            rgba(250, 245, 255, 0.85) 65%,
            rgba(252, 245, 255, 0.85) 70%,
            rgba(254, 245, 255, 0.85) 75%,
            rgba(255, 245, 255, 0.85) 80%,
            rgba(255, 245, 253, 0.85) 85%,
            rgba(255, 245, 251, 0.85) 90%,
            rgba(255, 245, 249, 0.85) 95%,
            rgba(255, 245, 247, 0.85) 100%
          );
        transition: transform 0.3s ease-in-out;
        -webkit-mask-image: none;
        mask-image: none;
      }

      #theme-heo #today-card-cover-image {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      #theme-heo #today-card-info {
        color: rgba(0, 0, 0, 0.8);
      }

      #theme-heo #today-card-tips {
        color: rgba(0, 0, 0, 0.6);
        opacity: 0.8;
        font-size: 12px;
        font-weight: 400;
      }

      #theme-heo #today-card-title {
        color: rgba(3, 145, 150, 0.82);
        font-size: 28px;
        font-weight: 700;
        line-height: 36px;
      }

      #theme-heo #today-card-more-button {
        width: 125px;
        height: 40px;
        color: #d7537e;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #e3e8f7;
        border-radius: 20px;
        box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.05);
        font-weight: 400;
        transition: all 0.3s;
        -webkit-backdrop-filter: saturate(180%) blur(20px);
        backdrop-filter: saturate(180%) blur(20px);
      }

      #theme-heo #today-card-more-button svg {
        flex-shrink: 0;
        margin-right: 8px;
        font-size: 22px;
      }

      #theme-heo #today-card-more-button:hover {
        color: rgba(0, 0, 0, 0.9);
        background: rgba(0, 0, 0, 0.1);
      }

      #theme-heo .heo-nav-hover {
        transition:
          color 0.18s ease,
          background 0.18s ease,
          box-shadow 0.18s ease;
      }

      #theme-heo .heo-nav-hover:hover {
        color: #1e73be;
        background:
          linear-gradient(rgba(255, 255, 255, 0.96), rgba(235, 244, 255, 0.88)),
          radial-gradient(circle at 22% 20%, rgba(147, 197, 253, 0.35), transparent 58%);
        box-shadow:
          inset 0 0 0 1px rgba(147, 197, 253, 0.76),
          inset 0 1px 1px rgba(255, 255, 255, 0.7),
          0 8px 18px rgba(59, 130, 246, 0.12);
        text-decoration: none;
      }

      html.dark #theme-heo .heo-nav-hover:hover {
        color: #bfdbfe;
        background:
          linear-gradient(rgba(30, 41, 59, 0.92), rgba(30, 58, 138, 0.46)),
          radial-gradient(circle at 22% 20%, rgba(96, 165, 250, 0.28), transparent 58%);
        box-shadow:
          inset 0 0 0 1px rgba(96, 165, 250, 0.52),
          inset 0 1px 1px rgba(255, 255, 255, 0.08),
          0 8px 18px rgba(37, 99, 235, 0.22);
      }

      // AI打字机，闪烁光标
      .blinking-cursor {
        background-color: var(--ai-title);
        width: 10px;
        height: 16px;
        display: inline-block;
        vertical-align: middle;
        margin-left: 4px;
        animation: blinking-cursor 0.5s infinite;
        -webkit-animation: blinking-cursor 0.5s infinite;
      }

      @keyframes blinking-cursor {
        0% {
            opacity: 1;
        }
        
        40% {
            opacity: 1;
        }
        
        50% {
            opacity: 0;
        }
        
        90% {
            opacity: 0;
        }
        
        100% {
            opacity: 1;
        }
      }

      // 标签滚动动画
      .tags-group-wrapper {
        animation: rowup 60s linear infinite;
      }

      @keyframes rowup {
        0% {
          transform: translateX(0%);
        }
        100% {
          transform: translateX(-50%);
        }
      }

      /* Loading 动画样式 */
      #loading-box {
        position: fixed;
        display: flex;
        justify-content: center;
        align-items: center;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        height: 100dvh;
        z-index: 1001;
        opacity: 1;
        visibility: visible;
        transition:
          opacity .4s ease 1.6s,
          visibility 0s linear 2.0s;
      }

      #loading-box.loaded {
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
      }

      /* 退出动画：滑出效果 */
      #loading-box.loaded .loading-bg,
      #loading-box.loaded .loading-animation {
        border-radius: 3rem;
        transform: translateX(100%);
        transition: 1.3s ease;
      }

      #loading-box.loaded .loading-bg {
        transition-delay: 0.3s;
      }

      #loading-box .loading-bg,
      #loading-box .loading-animation {
        position: absolute;
        width: 100%;
        height: 100%;
        will-change: transform;
      }

      #loading-box .loading-bg {
        background: #4f65f0 url("/loadings.svg") repeat;
        background-size: 30%;
      }

      html.dark #loading-box .loading-bg {
        background: #eab308 url("/loadings.svg") repeat;
        background-size: 30%;
      }

      #loading-box .loading-animation {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        background: var(--heo-surface-strong);
      }

      html.dark #loading-box .loading-animation {
        background: var(--heo-surface-dark);
      }

      #loading-box .loading-animation .loading {
        width: 16rem;
        height: 16rem;
      }

      /* SVG 描边动画 */
      #loading-box .loading-animation .loading path {
        stroke: var(--heo-text);
        stroke-width: 0.5px;
        animation: dashArray 5s ease-in-out infinite, dashOffset 5s linear infinite;
      }

      #loading-box .loading-animation .loading path.color {
        stroke: #4f65f0;
      }

      html.dark #loading-box .loading-animation .loading path {
        stroke: var(--heo-text);
      }

      html.dark #loading-box .loading-animation .loading path.color {
        stroke: #eab308;
      }

      /* Loading 文字及故障效果 */
      #loading-box .loading-text {
        position: relative;
        margin-top: 1rem;
        font-size: 26px;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: 0.3rem;
        z-index: 1;
        animation: shift 1s ease-in-out infinite alternate;
        color: var(--heo-text);
      }

      #loading-box .loading-text:before,
      #loading-box .loading-text:after {
        display: block;
        content: attr(data-glitch);
        position: absolute;
        top: 0;
        left: 0;
        opacity: 0.8;
      }

      #loading-box .loading-text:before {
        animation: glitch 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite;
        color: #ff5252;
        z-index: -1;
      }

      #loading-box .loading-text:after {
        animation: glitch 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) reverse both infinite;
        color: #2ecc71;
        z-index: -2;
      }

      html.dark #loading-box .loading-text {
        color: var(--heo-text);
      }

      html.dark #loading-box .loading-text:before {
        color: #f97316;
      }

      html.dark #loading-box .loading-text:after {
        color: #22c55e;
      }

      /* Keyframes */
      @keyframes dashArray {
        0% { stroke-dasharray: 0 1 359 0; }
        50% { stroke-dasharray: 0 359 1 0; }
        100% { stroke-dasharray: 359 1 0 0; }
      }

      @keyframes dashOffset {
        0% { stroke-dashoffset: 365; }
        100% { stroke-dashoffset: 5; }
      }

      @keyframes glitch {
        0% { transform: translate(0); }
        20% { transform: translate(-3px, 3px); }
        40% { transform: translate(-3px, -3px); }
        60% { transform: translate(3px, 3px); }
        80% { transform: translate(3px, -3px); }
        100% { transform: translate(0); }
      }

      @keyframes shift {
        0%, 40%, 44%, 58%, 61%, 65%, 69%, 73%, 100% { transform: skewX(0deg); }
        41% { transform: skewX(10deg); }
        42% { transform: skewX(-10deg); }
        59% { transform: skewX(40deg) skewY(10deg); }
        60% { transform: skewX(-40deg) skewY(-10deg); }
        63% { transform: skewX(10deg) skewY(-5deg); }
        70% { transform: skewX(-50deg) skewY(-20deg); }
        71% { transform: skewX(10deg) skewY(-10deg); }
      }

      @media (prefers-reduced-motion: reduce) {
        #loading-box,
        #loading-box * {
          animation: none !important;
          transition: none !important;
        }
        #loading-box.loaded .loading-bg,
        #loading-box.loaded .loading-animation {
          transform: none !important;
        }
      }

      @media (max-width: 768px) {
        #loading-box.loaded .loading-bg,
        #loading-box.loaded .loading-animation {
          transition-duration: 0.7s;
        }
      }

      /* AI文章摘要字体大小 */
      .font-bold.ml-2 {
        font-size: 18px;
      }

      /* 标签颜色 */
      .hover\:bg-indigo-600:hover {
        background-color: #ff6817;
      }
      .group:hover .md\:group-hover\:bg-indigo-600 {
        background-color: #ff6817;
      }
      .bg-indigo-600 {
        background-color: #ff6817;
      }
      .hover\:text-indigo-600:hover {
        color: #3a86ff;
      }

      /* 推荐文章字体颜色 */
      .group:hover .group-hover\:text-indigo-600 {
        color: #3a86ff;
      }

      /* 首页字体颜色 */
      .group:hover .group-hover\:text-indigo-700 {
        color: #3a86ff;
      }
      .hover\:text-indigo-700:hover {
        color: #3a86ff;
      }

      /* 目录字体颜色 */
      .text-indigo-600 {
        color: #3a86ff;
      }

      /* 复选框颜色 */
      .hover\:border-indigo-600:hover {
        border-color: rgba(58, 134, 255, 0.6);
        box-shadow:
          0 0 0 1px rgba(58, 134, 255, 0.6),
          0 8px 24px rgba(58, 134, 255, 0.1);
        transition: border-color 0.25s cubic-bezier(.2,.8,.2,1),
                    box-shadow 0.25s cubic-bezier(.2,.8,.2,1);
      }
      .hover\:border-blue-600:hover {
        border-color: rgba(160, 210, 255, 0.65);
        box-shadow:
          inset 0 0 0 999px rgba(160, 210, 255, 0.05),
          inset 0 1px 0 rgba(255, 255, 255, 0.20),
          0 0 0 6px rgba(140, 200, 255, 0.22),
          0 12px 30px rgba(0, 0, 0, 0.12);
        transition:
          border-color 0.22s cubic-bezier(.2,.8,.2,1),
          box-shadow 0.22s cubic-bezier(.2,.8,.2,1);
      }
      .dark .hover\:border-indigo-600:hover {
        border-color: rgba(120, 170, 255, 0.75);
        box-shadow:
          0 0 0 1px rgba(120, 170, 255, 0.45),
          0 10px 26px rgba(0, 0, 0, 0.45);
      }
      .dark .hover\:border-blue-600:hover {
        border-color: rgba(170, 215, 255, 0.70);
        box-shadow:
          inset 0 0 0 999px rgba(170, 215, 255, 0.035),
          inset 0 1px 0 rgba(255, 255, 255, 0.10),
          0 0 0 6px rgba(140, 200, 255, 0.20),
          0 16px 40px rgba(0, 0, 0, 0.55);
      }

      .notion a:not(.notion-page-link):not(.notion-collection-card):not(.notion-hash-link):not(.notion-bookmark):not(.blog-link) {
          position: relative;
          color: rgba(33, 150, 243, 1);
          transition: box-shadow 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          text-decoration: none;
          border-radius: 5px;
      }

      .notion a:not(.notion-page-link):not(.notion-collection-card):not(.notion-hash-link):not(.notion-bookmark)::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: -0.07em;
          width: 0;
          height: 0.1rem;
          background-image: linear-gradient(90.68deg, #b439df 0.26%, #e5337e 102.37%);
          transition: width 0.3s ease, left 0.3s ease;
          display: block;
          transform: translateX(-50%);
      }

      .notion a:not(.notion-page-link):not(.notion-collection-card):not(.notion-hash-link):not(.notion-bookmark):not(.blog-link):hover,
      .notion a:not(.notion-page-link):not(.notion-collection-card):not(.notion-hash-link):not(.notion-bookmark):not(.blog-link):focus {
          box-shadow: inset 0 -1.5em 0 rgba(33, 150, 243, 0.2);
          color: rgba(33, 150, 243, 1);
          border-radius: 6px;
      }

      .notion a:not(.notion-page-link):not(.notion-collection-card):not(.notion-hash-link):not(.notion-bookmark):not(.blog-link):hover::after,
      .notion a:not(.notion-page-link):not(.notion-collection-card):not(.notion-hash-link):not(.notion-bookmark):not(.blog-link):focus::after {
          width: 100%;
          left: 50%;
      }

      .notion-table-of-contents-item:hover {
        background-color: #ebf4ff !important;
      }

      .dark .notion-table-of-contents-item:hover {
        background-color: #9a34122e !important;
      }
    `}</style>
  )
}

export { Style }
