import { useGlobal } from '@/lib/global'

/**
 * 字数统计
 * @returns
 */
export default function WordCount({ wordCount, readTime }) {
  const { locale } = useGlobal()
  return (
    <span id='wordCountWrapper' className='flex gap-5 font-light'>
      <span className='flex whitespace-nowrap items-center'>
        <i className='mr-1 fas fa-file-word' />
        <span>{locale.COMMON.WORD_COUNT}</span>&nbsp;
        <span id='wordCount'>{wordCount}</span>
      </span>
      <span className='flex whitespace-nowrap items-center'>
        <i className='mr-1 fas fa-clock' />
        <span>{locale.COMMON.READ_TIME}≈</span>&nbsp;
        <span id='readTime'>{readTime}</span>&nbsp;{locale.COMMON.MINUTE}
      </span>
    </span>
  )
}