import React, {CSSProperties, HTMLAttributes, useEffect, useState} from 'react';
import {extractHeadingStructure, StructureElement} from "./structure";
import {isNil} from "lodash";
import {FaUtils} from '@fa/ui'
import './FaToc.scss'
import {useScroll} from "ahooks";


export interface FaTocProps extends HTMLAttributes<any> {
  // parentDomId: string; // 滚动容器dom的id，监听dom的滚动位置
  domId: string; // html富文本内容，侦测此dom元素的h标签结构
  style?: CSSProperties;
}

/**
 * @author xu.pengfei
 * @date 2023/7/3 15:53
 */
export default function FaToc({domId, style, ...props}: FaTocProps) {
  const [array, setArray] = useState<StructureElement[]>([])

  const scroll = useScroll(document.getElementById('fa-doc-div'));
  console.log('scroll', scroll)

  useEffect(() => {
    const dom = document.getElementById(domId);
    const toc = extractHeadingStructure(dom!)
    setArray(toc)
  }, [domId])

  function handleClickTocLink(e: any) {
    const faTocId = e.target.getAttribute('fa-toc-id')
    // console.log('handleClickTocLink', e, faTocId)
    FaUtils.scrollToDomById(faTocId)
  }

  function loopToc(tocArr: StructureElement[], level: number, prefix: string = '0'): any {
    if (isNil(tocArr) || tocArr.length === 0) return null;

    return (
      <div>
        {tocArr.map((toc, i) => {
          const id = `${prefix}_${i}`
          if (toc.element) {
            toc.element.setAttribute('id', id)
          }
          return (
            <div key={id}>
              <div
                className="fa-toc-item"
                style={{paddingLeft: level * 12 + 6}}
                fa-toc-id={id}
                onClick={handleClickTocLink}
              >{toc.element.innerText}</div>
              <div>{loopToc(toc.children, level + 1, `${prefix}_${level}`)}</div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{...style}} className="fa-toc fa-scroll-auto-y" {...props}>
      {loopToc(array, 0)}
    </div>
  )
}