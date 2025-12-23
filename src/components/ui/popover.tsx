import React, { Fragment, ReactNode } from 'react';
import { Popover as HeadlessPopover, Transition } from '@headlessui/react';

interface PopoverProps {
    children: ReactNode;
}

interface PopoverTriggerProps {
    asChild?: boolean;
    children: ReactNode;
}

interface PopoverContentProps {
    children: ReactNode;
    className?: string;
    align?: 'start' | 'center' | 'end';
}

export function Popover({ children }: PopoverProps) {
    return <HeadlessPopover className="relative">{children}</HeadlessPopover>;
}

export function PopoverTrigger({ children, asChild }: PopoverTriggerProps) {
    if (asChild && React.isValidElement(children)) {
        return <HeadlessPopover.Button as={Fragment}>{children}</HeadlessPopover.Button>;
    }
    return <HeadlessPopover.Button>{children}</HeadlessPopover.Button>;
}

export function PopoverContent({ children, className = '', align = 'center' }: PopoverContentProps) {
    const alignmentClasses = {
        start: 'left-0',
        center: 'left-1/2 -translate-x-1/2',
        end: 'right-0',
    };

    return (
        <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
        >
            <HeadlessPopover.Panel
                className={`absolute z-50 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl ring-1 ring-black/5 ${alignmentClasses[align]} ${className}`}
            >
                {children}
            </HeadlessPopover.Panel>
        </Transition>
    );
}
