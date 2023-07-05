'use client'

import FUKA_CONFIG from './config_fuka'
import CommonHead from '@/components/CommonHead'
import TopNav from './components/TopNav'
import AsideLeft from './components/AsideLeft'
import Live2D from '@/components/Live2D'
import BLOG from '@/blog.config'
import { isBrowser, loadExternalResource } from '@/lib/utils'
import { useGlobal } from '@/lib/global'
import BlogListPage from './components/BlogListPage'
import BlogListScroll from './components/BlogListScroll'
import BlogArchiveItem from './components/BlogPostArchive'
import ArticleDetail from './components/ArticleDetail'
import { ArticleLock } from './components/ArticleLock'
import TagItemMini from './components/TagItemMini'
import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useState } from 'react'
import Mark from 'mark.js'
import Link from 'next/link'
import { Transition } from '@headlessui/react'

// 主题全局状态
const ThemeGlobalFukasawa = createContext()
export const useFukasawaGlobal = () => useContext(ThemeGlobalFukasawa)

/**
 * 基础布局 采用左右两侧布局，移动端使用顶部导航栏
 * @param children
 * @param layout
 * @param tags
 * @param meta
 * @param post
 * @param currentSearch
 * @param currentCategory
 * @param currentTag
 * @param categories
 * @returns {JSX.Element}
 * @constructor
 */
const LayoutBase = (props) => {
  const { children, headerSlot, meta } = props
  const leftAreaSlot = <Live2D />
  const { onLoading } = useGlobal()

  // 侧边栏折叠从 本地存储中获取 open 状态的初始值
  const [open, setOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fukasawa-sidebarOpen') === 'true' || FUKA_CONFIG.SIDEBAR_OPEN_SATUS_DEFAULT
    }
    return FUKA_CONFIG.SIDEBAR_OPEN_SATUS_DEFAULT
  })

  // 在组件卸载时保存 open 状态到本地存储中
  useEffect(() => {
    if (isBrowser()) {
      localStorage.setItem('fukasawa-sidebarOpen', open)
    }
  }, [open])

  // 增加一个状态以触发 Transition 组件的动画
  const [showTransition, setShowTransition] = useState(true)
  useEffect(() => {
    // 当 location 或 children 发生变化时，触发动画
    setShowTransition(false)
    setTimeout(() => setShowTransition(true), 5)
  }, [onLoading])

  if (isBrowser()) {
    loadExternalResource('/css/theme-fukasawa.css', 'css')
  }

  return (
        <ThemeGlobalFukasawa.Provider value={{ open, setOpen }}>

            <div id='theme-fukasawa'>
                <CommonHead meta={meta} />
                <TopNav {...props} />

                <div className={(BLOG.LAYOUT_SIDEBAR_REVERSE ? 'flex-row-reverse' : '') + ' flex'}>
                    {/* 侧边抽屉 */}
                    <AsideLeft {...props} slot={leftAreaSlot} />

                    <main id='wrapper' className='relative flex w-full py-8 justify-center bg-day dark:bg-night'>
                        <div id='container-inner' className='2xl:max-w-6xl md:max-w-4xl w-full relative z-10'>

                            <Transition
                                show={showTransition}
                                appear={true}
                                className="w-full"
                                enter="transition ease-in-out duration-700 transform order-first"
                                enterFrom="opacity-0 translate-y-16"
                                enterTo="opacity-100 translate-y-0"
                                leave="transition ease-in-out duration-300 transform"
                                leaveFrom="opacity-100 translate-y-0"
                                leaveTo="opacity-0 -translate-y-16"
                                unmount={false}
                            >
                                <div> {headerSlot} </div>
                                <div> {children} </div>

                            </Transition>
                        </div>
                    </main>

                </div>

            </div>
        </ThemeGlobalFukasawa.Provider>
  )
}

/**
 * 首页
 * @param {*} props notion数据
            * @returns 首页就是一个博客列表
            */
const LayoutIndex = (props) => {
  return <LayoutPostList {...props} />
}

/**
 * 博客列表
 * @param {*} props
            */
const LayoutPostList = (props) => {
  return <LayoutBase {...props}>
        {BLOG.POST_LIST_STYLE === 'page' ? <BlogListPage {...props} /> : <BlogListScroll {...props} />}
    </LayoutBase>
}

/**
 * 文章详情
 * @param {*} props
            * @returns
            */
const LayoutSlug = (props) => {
  const { lock, validPassword } = props
  return (
        <LayoutBase {...props} >
            {lock ? <ArticleLock validPassword={validPassword} /> : <ArticleDetail {...props} />}
        </LayoutBase>
  )
}

/**
 * 搜索页
 */
const LayoutSearch = (props) => {
  const { keyword } = props
  const router = useRouter()
  useEffect(() => {
    setTimeout(() => {
      const container = isBrowser() && document.getElementById('posts-wrapper')
      if (container && container.innerHTML) {
        const re = new RegExp(keyword, 'gim')
        const instance = new Mark(container)
        instance.markRegExp(re, {
          element: 'span',
          className: 'text-red-500 border-b border-dashed'
        })
      }
    }, 300)
  }, [router])
  return <LayoutPostList />
}

/**
 * 归档页面
 */
const LayoutArchive = (props) => {
  const { archivePosts } = props
  return <LayoutBase {...props}>
        <div className="mb-10 pb-20 bg-white md:p-12 p-3 dark:bg-gray-800 shadow-md min-h-full">
            {Object.keys(archivePosts).map(archiveTitle => (
                <BlogArchiveItem
                    key={archiveTitle}
                    posts={archivePosts[archiveTitle]}
                    archiveTitle={archiveTitle}
                />
            ))}
        </div>
    </LayoutBase>
}

/**
 * 404
 * @param {*} props
            * @returns
            */
const Layout404 = props => {
  return <LayoutBase {...props}>404</LayoutBase>
}

/**
 * 分类列表
 * @param {*} props
            * @returns
            */
const LayoutCategoryIndex = (props) => {
  const { locale } = useGlobal()
  const { categoryOptions } = props
  return (
        <LayoutBase {...props}>
            <div className='bg-white dark:bg-gray-700 px-10 py-10 shadow'>
                <div className='dark:text-gray-200 mb-5'>
                    <i className='mr-4 fas fa-th' />{locale.COMMON.CATEGORY}:
                </div>
                <div id='category-list' className='duration-200 flex flex-wrap'>
                    {categoryOptions?.map(category => {
                      return (
                            <Link
                                key={category.name}
                                href={`/category/${category.name}`}
                                passHref
                                legacyBehavior>
                                <div
                                    className={'hover:text-black dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-600 px-5 cursor-pointer py-2 hover:bg-gray-100'}>
                                    <i className='mr-4 fas fa-folder' />{category.name}({category.count})
                                </div>
                            </Link>
                      )
                    })}
                </div>
            </div>
        </LayoutBase>
  )
}

/**
 * 标签列表
 * @param {*} props
            * @returns
            */
const LayoutTagIndex = (props) => {
  const { locale } = useGlobal()
  const { tagOptions } = props
  return <LayoutBase {...props} >
        <div className='bg-white dark:bg-gray-700 px-10 py-10 shadow'>
            <div className='dark:text-gray-200 mb-5'><i className='mr-4 fas fa-tag' />{locale.COMMON.TAGS}:</div>
            <div id="tags-list" className="duration-200 flex flex-wrap ml-8">
                {tagOptions.map(tag => {
                  return (
                        <div key={tag.name} className="p-2">
                            <TagItemMini key={tag.name} tag={tag} />
                        </div>
                  )
                })}
            </div>
        </div>
    </LayoutBase>
}

export {
  FUKA_CONFIG as THEME_CONFIG,
  LayoutIndex,
  LayoutSearch,
  LayoutArchive,
  LayoutSlug,
  Layout404,
  LayoutPostList,
  LayoutCategoryIndex,
  LayoutTagIndex
}
