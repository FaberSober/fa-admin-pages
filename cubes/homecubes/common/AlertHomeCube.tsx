import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { Admin } from '@features/fa-admin-pages/types';
import { alertApi } from '@features/fa-admin-pages/services';
import AlertModal from '@features/fa-admin-pages/pages/admin/system/base/alert/modal/AlertModal';
import { useNavigate } from 'react-router-dom';
import { ExclamationCircleOutlined, DownOutlined } from '@ant-design/icons';
import { Badge, Tooltip } from 'antd';

// 配置常量
const CONFIG = {
  CAROUSEL_INTERVAL: 1500,  // 轮播间隔(ms)
  DATA_REFRESH_INTERVAL: 3600000, // 刷新间隔(ms) - 1小时
  ANIMATION_DURATION: 300   // 动画时长(ms)
};

export function AlertHomeCube() {
  const navigate = useNavigate();
  const [allAlerts, setAllAlerts] = useState<Admin.Alert[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0); // 滚动位置
  const [isPaused, setIsPaused] = useState(false); // 控制轮播暂停的状态
  const [itemHeight, setItemHeight] = useState(40); // 单条数据高度
  const containerRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLDivElement>(null);
  const carouselTimerRef = useRef<NodeJS.Timeout | null>(null); // 轮播定时器
  const dataTimerRef = useRef<NodeJS.Timeout | null>(null);    // 数据刷新定时器
  const isMounted = useRef(true); // 跟踪组件是否已卸载

  // 刷新数据（关键修改：使用useRef确保只有一个实例）
  const refreshData = useCallback(async () => {
    // 确保组件已挂载，避免内存泄漏
    if (!isMounted.current) return;

    console.log('执行API请求:', new Date().toISOString()); // 调试日志

    try {
      const res = await alertApi.list({
        query: { deal: false },
        sorter: 'ID DESC'
      });
      const newData = res.data || [];
      setAllAlerts(newData);

      // 数据更新时重置滚动位置
      setScrollPosition(prev => prev >= newData.length ? 0 : prev);
    } catch (error) {
      console.error('获取预警信息失败:', error);
    }
  }, []);

  // 安排下一次数据刷新（使用递归setTimeout确保严格间隔）
  const scheduleNextRefresh = useCallback(() => {
    // 清除现有定时器
    if (dataTimerRef.current) {
      clearTimeout(dataTimerRef.current);
    }

    // 设置新的定时器，递归调用自身
    dataTimerRef.current = setTimeout(async () => {
      await refreshData();
      if (isMounted.current) { // 确保组件仍挂载
        scheduleNextRefresh();
      }
    }, CONFIG.DATA_REFRESH_INTERVAL);
  }, [refreshData]);

  // 轮播到下一条（核心逻辑）
  const carouselNext = useCallback(() => {
    if (allAlerts.length <= 1 || isPaused) {
      return;
    }

    const container = containerRef.current;
    if (container && firstItemRef.current) {
      const height = firstItemRef.current.offsetHeight || itemHeight;
      setItemHeight(height);

      // 执行向上滚动动画
      container.style.transition = `transform ${CONFIG.ANIMATION_DURATION}ms ease-out`;
      container.style.transform = `translateY(-${(scrollPosition + 1) * height}px)`;

      // 动画结束后更新滚动位置
      setTimeout(() => {
        setScrollPosition(prev => prev >= allAlerts.length - 1 ? 0 : prev + 1);
        container.style.transition = 'none';
      }, CONFIG.ANIMATION_DURATION);
    }
  }, [allAlerts.length, isPaused, itemHeight, scrollPosition]);

  // 启动轮播
  const startCarousel = useCallback(() => {
    if (carouselTimerRef.current) {
      clearInterval(carouselTimerRef.current);
    }
    carouselTimerRef.current = setInterval(carouselNext, CONFIG.CAROUSEL_INTERVAL);
  }, [carouselNext]);

  // 停止轮播
  const stopCarousel = useCallback(() => {
    if (carouselTimerRef.current) {
      clearInterval(carouselTimerRef.current);
      carouselTimerRef.current = null;
    }
  }, []);

  // 初始化
  useEffect(() => {
    // 初始加载数据
    refreshData().then(() => {
      startCarousel();
      scheduleNextRefresh(); // 安排第一次数据刷新
    });

    // 组件卸载时清理
    return () => {
      isMounted.current = false; // 标记组件已卸载
      stopCarousel();
      if (dataTimerRef.current) {
        clearTimeout(dataTimerRef.current);
      }
    };
  }, [refreshData, startCarousel, scheduleNextRefresh, stopCarousel]);

  // 滚动位置变化时更新容器位置
  useEffect(() => {
    if (containerRef.current && firstItemRef.current) {
      const height = firstItemRef.current.offsetHeight || itemHeight;
      containerRef.current.style.transform = `translateY(-${scrollPosition * height}px)`;
    }
  }, [scrollPosition, itemHeight]);

  // 监听元素高度变化
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setItemHeight(entries[0].contentRect.height);
      }
    });
    if (firstItemRef.current) {
      observer.observe(firstItemRef.current);
    }
    return () => {
      if (firstItemRef.current) {
        observer.unobserve(firstItemRef.current);
      }
    };
  }, []);

  // 点击控制轮播暂停/恢复
  const toggleCarousel = useCallback(() => {
    setIsPaused(prev => {
      if (prev) {
        startCarousel(); // 恢复轮播
      } else {
        stopCarousel(); // 暂停轮播
      }
      return !prev;
    });
  }, [startCarousel, stopCarousel]);

  return (
    <div
      className="fa-full-content"
      onClick={toggleCarousel}
      style={{
        position: 'relative',
        overflow: 'hidden',
        paddingBottom: 8,
        cursor: 'pointer'
      }}
    >
      <a
        style={{
          position: 'absolute',
          right: 12,
          top: -3,
          zIndex: 9999,
          color: '#1890ff',
          textDecoration: 'underline',
          fontSize: 14
        }}
        onClick={(e) => {
          e.preventDefault();
          navigate('/admin/system/base/alert');
        }}
      >
        更多
      </a>

      {/* 滚动容器 */}
      <div
        style={{
          overflow: 'hidden',
          position: 'relative',
          marginTop: 16
        }}
      >
        <div ref={containerRef}>
          {allAlerts.map((item, index) => (
            <AlertModal
              key={item.id}
              record={item}
              title="处理告警"
              fetchFinish={refreshData}
            >
              <div
                ref={index === 0 ? firstItemRef : null}
                className="fa-flex-row-center fa-link-grey fa-p8 fa-border-b"
                style={{
                  backgroundColor: index === scrollPosition ? '#fff8f8' : 'transparent',
                  borderLeft: index === scrollPosition ? '3px solid #ff4d4f' : 'none',
                  minHeight: '40px'
                }}
              >
                <div style={{ width: 120, fontWeight: 500 }}>
                  <Tooltip title={item.type}>
                    <span className="ellipsis">{item.type}</span>
                  </Tooltip>
                </div>

                <div className="fa-flex-1" style={{ padding: '0 8px' }}>
                  <div className="flex items-center">
                    <ExclamationCircleOutlined
                      style={{ color: '#ff4d4f', marginRight: 4, fontSize: 14 }}
                    />
                    <Tooltip title={item.content}>
                      <span className="ellipsis">{item.content}</span>
                    </Tooltip>
                  </div>
                </div>

                <div style={{ width: 150, textAlign: 'right' }}>
                  <Badge status="processing" text={item.crtTime || ''} />
                </div>
              </div>
            </AlertModal>
          ))}
        </div>
      </div>

      {/* 空状态 */}
      {allAlerts.length === 0 && (
        <div className="fa-flex-center fa-p16" style={{ color: '#999' }}>
        </div>
      )}

      {/* 轮播指示器 - 显示当前状态 */}
      {allAlerts.length > 1 && (
        <div className="fa-flex-center" style={{ marginTop: 8 }}>
          <DownOutlined
            style={{
              color: '#1890ff',
              fontSize: 16,
              animation: isPaused ? 'none' : 'bounce 2s infinite'
            }}
          />
          <span style={{
            fontSize: 12,
            color: '#666',
            marginLeft: 8
          }}>
            {isPaused ? '已暂停' : `共 ${allAlerts.length} 条预警信息`}
          </span>
        </div>
      )}
    </div>
  );
}

AlertHomeCube.displayName = 'AlertHomeCube';
AlertHomeCube.title = '预警信息';
AlertHomeCube.description = '展示系统中未处理的预警信息（每1.5秒向上滚动一条）';
AlertHomeCube.showTitle = true;
AlertHomeCube.permission = '';
AlertHomeCube.w = 8;
AlertHomeCube.h = 8;
