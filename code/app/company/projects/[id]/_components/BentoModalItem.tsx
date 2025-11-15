'use client'

import { useState, ReactNode } from 'react'
import { BentoGridItem } from '@/components/ui/bento-grid'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useOverflowDetection } from './hooks/useOverflowDetection'
import { Maximize2 } from 'lucide-react'

interface BentoModalItemProps {
  title: string
  icon: ReactNode
  children: ReactNode
  className?: string
  modalTitle?: string
  modalMaxWidth?: string
}

export function BentoModalItem({ 
  title, 
  icon, 
  children, 
  className = '',
  modalTitle,
  modalMaxWidth = 'max-w-4xl'
}: BentoModalItemProps) {
  const [contentRef, isOverflowing] = useOverflowDetection<HTMLDivElement>()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <BentoGridItem
        className={`${className} ${isOverflowing ? 'cursor-pointer' : ''} transition-all relative group/modal`}
        icon={icon}
        title={title}
        header={
          <div 
            ref={contentRef}
            className="overflow-hidden relative"
            onClick={() => isOverflowing && setIsModalOpen(true)}
            style={{ maxHeight: 'calc(100% - 80px)' }} // Leave room for icon/title at bottom
          >
            {children}
            
            {/* Overflow indicator - gradient fade and expand icon */}
            {isOverflowing && (
              <>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-card to-transparent pointer-events-none" />
                <div className="absolute bottom-2 right-2 p-1.5 rounded-md bg-white/80 dark:bg-card/80 border border-neutral-200 dark:border-white/[0.2] opacity-0 group-hover/modal:opacity-100 transition-opacity">
                  <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </>
            )}
          </div>
        }
      />
      
      {isOverflowing && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className={`${modalMaxWidth} max-h-[85vh] overflow-y-auto`}>
            <DialogHeader>
              <DialogTitle>{modalTitle || title}</DialogTitle>
            </DialogHeader>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {children}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

