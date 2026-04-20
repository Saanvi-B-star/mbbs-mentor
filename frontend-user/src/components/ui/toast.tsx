import * as React from "react"

export interface ToastProps {
    id?: string
    title?: React.ReactNode
    description?: React.ReactNode
    action?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export type ToastActionElement = React.ReactElement<any>

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
    ({ title, description, ...props }, ref) => (
        <div ref={ref} {...props}>
            {title && <div>{title}</div>}
            {description && <div>{description}</div>}
        </div>
    )
)
Toast.displayName = "Toast"
