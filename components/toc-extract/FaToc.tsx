import React, {CSSProperties, HTMLAttributes, useEffect, useState} from 'react';
import {extractHeadingStructure, StructureElement} from "./structure";
import './FaToc.scss'
import {useScroll} from "ahooks";


export interface FaTocProps extends HTMLAttributes<any> {
  parentDomId: string; // 滚动容器dom的id，监听dom的滚动位置
  domId: string; // html富文本内容，侦测此dom元素的h标签结构
  style?: CSSProperties;
}

interface CalElement {
  id: string;
  element: HTMLElement;
  top: number;
  bottom: number;
  level: number;
}

let TOP_GAP = 109; // 距离顶部的高度默认距离

/** 平铺Tree型结构 */
export function flatTreeList(tree: StructureElement[] = [], level = 0, prefix = '0'): CalElement[] {
  const list: CalElement[] = [];
  tree.forEach((item, index) => {
    const { children, element } = item;
    const id = `${prefix}_${index}`
    element.setAttribute('id', id)
    list.push({ id, element, top: element.offsetTop, bottom: element.offsetTop + element.clientHeight, level });
    if (children && children[0]) {
      list.push(...flatTreeList(children, level + 1, id));
    }
  });
  return list;
}

/**
 * @author xu.pengfei
 * @date 2023/7/3 15:53
 */
export default function FaToc({parentDomId, domId, style, ...props}: FaTocProps) {
  const [_array, setArray] = useState<StructureElement[]>([])
  const [calElements, setCalElements] = useState<CalElement[]>([])

  const scroll = useScroll(document.getElementById(parentDomId));
  // console.log('scroll', scroll)

  useEffect(() => {
    const dom = document.getElementById(domId);
    const toc = extractHeadingStructure(dom!)
    setArray(toc)
    // console.log('toc', toc)

    const flatElementList = flatTreeList(toc)
    const calElements:CalElement[] = flatElementList.map((v, i) => {
      let bottom = 9999999;
      if (i < flatElementList.length - 1) {
        const nextEle = flatElementList[i + 1]
        bottom = nextEle.top;
      }
      return {
        id: v.id,
        element: v.element,
        top: v.top,
        bottom,
        level: v.level,
      }
    })
    // console.log('calElements', calElements)
    setCalElements(calElements)

    if (calElements && calElements[0]) {
      TOP_GAP = calElements[0].top;
    }
  }, [domId])

  function handleClickTocLink(toc: CalElement) {
    const parentDom = document.getElementById(parentDomId)
    if (parentDom) {
      parentDom.scrollTo(0, toc.top)
    }
  }

  // 循环tree生成树
  // function loopToc(tocArr: StructureElement[], level: number, prefix: string = '0'): any {
  //   if (isNil(tocArr) || tocArr.length === 0) return null;
  //
  //   return (
  //     <div>
  //       {tocArr.map((toc, i) => {
  //         const id = `${prefix}_${i}`
  //         if (toc.element) {
  //           toc.element.setAttribute('id', id)
  //
  //           console.log('toc.element.offsetTop', toc.element.innerText, toc.element.offsetTop, scroll?.top)
  //         }
  //         let indicator = false;
  //         if (scroll && scroll.top > toc.element.offsetTop) {
  //           indicator = true;
  //         }
  //         return (
  //           <div key={id}>
  //             <div
  //               className="fa-toc-item"
  //               style={{paddingLeft: level * 12 + 6}}
  //               fa-toc-id={id}
  //               onClick={handleClickTocLink}
  //             >
  //               <span>{toc.element.innerText}</span>
  //               {indicator && <div className="fa-toc-item-slider" />}
  //             </div>
  //             <div>{loopToc(toc.children, level + 1, `${prefix}_${level}`)}</div>
  //           </div>
  //         )
  //       })}
  //     </div>
  //   )
  // }

  return (
    <div style={{...style}} className="fa-toc fa-scroll-auto-y" {...props}>
      {/*{loopToc(array, 0)}*/}
      {/* 使用计算后的flatTreeList生成列表 */}
      {calElements.map((toc, index) => {
        let sel = false;
        if (scroll) {
          const fixScrollTop = scroll.top + TOP_GAP;
          if (fixScrollTop >= toc.top && fixScrollTop < toc.bottom) {
            sel = true;
          }
        }
        // 初始化未滚动的情况
        if (index === 0) {
          if (scroll === undefined || scroll.top === 0) {
            sel = true;
          }
        }
        return (
          <div
            key={toc.id}
            className={sel ? "fa-toc-item-sel" : "fa-toc-item"}
            style={{paddingLeft: toc.level * 12 + 6}}
            fa-toc-id={toc.id}
            onClick={() => handleClickTocLink(toc)}
          >
            <span>{toc.element.innerText}</span>
            {sel && <div className="fa-toc-item-slider" />}
          </div>
        )
      })}
    </div>
  )
}