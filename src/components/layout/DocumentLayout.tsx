import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DocumentLayoutProps {
    title: string;
    subtitle?: ReactNode;
    backTo?: string;
    backText?: string;
    actions?: ReactNode;
    status?: string;
    statusOptions?: string[];
    children: ReactNode;
    className?: string;
}

export function DocumentLayout({
    title,
    subtitle,
    backTo,
    backText = 'Back',
    actions,
    status,
    statusOptions = [],
    children,
    className,
}: DocumentLayoutProps) {
    const navigate = useNavigate();

    return (
        <div className={cn("flex flex-col gap-6 max-w-5xl mx-auto w-full", className)}>
            {/* Header Section */}
            <div className="flex flex-col gap-4">
                {backTo && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(backTo)}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        {backText}
                    </Button>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                        {subtitle && <div className="text-muted-foreground mt-1">{subtitle}</div>}
                    </div>

                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                </div>
            </div>

            {/* Status Pipeline & Action Bar */}
            {(status || (statusOptions.length > 0)) && (
                <Card className="rounded-lg shadow-sm border overflow-hidden">
                    <div className="flex flex-col sm:flex-row p-1 sm:p-2 sm:items-center justify-between bg-muted/40">
                        {/* Left side usually for primary call-to-actions, rendered by parent via 'actions' but we can also put status-specific bar here if needed. 
                Actually, the 'actions' prop is better suited for the top header or this bar. 
                Let's stick to the Odoo style where 'actions' are buttons on the left of the status bar.
            */}

                        {/* Note: The 'actions' prop passed to DocumentLayout is currently rendered in the top header. 
                 To match Odoo style strictly, we might want another prop 'statusbarActions' 
                 or just move the main 'actions' here. 
                 For now, let's keep 'actions' in top header as per typical web apps, 
                 BUT if we want Odoo style, we should probably have a 'statusbar' slot. 
                 
                 Let's assume the user provided `actions` are the main CREATE/EDIT buttons.
                 We will add a specific prop `workflowActions` for the status bar buttons (Confirm, Cancel, etc).
            */}
                    </div>

                    <div className="flex flex-wrap items-center justify-between p-3 sm:px-4 gap-4 bg-background border-t sm:border-t-0">
                        {/* Workflow Actions often go here on the left in Odoo, but let's keep it flexible. 
                 We will just render the status pipeline on the right.
             */}
                        <div className="flex-1">
                            {/* This space can be used for workflow buttons passed as children or a specialized prop. 
                    For now, we'll let the parent handle the buttons in the 'actions' prop, 
                    or render them at the top. 
                    
                    Wait, looking at the screenshot: 
                    "Confirm | Print | Send | Cancel" buttons are in a bar on the left.
                    "Draft > Confirm > Posted" status indicators are on the right.
                */}
                        </div>

                        {/* Status Pipeline */}
                        {statusOptions.length > 0 && (
                            <div className="flex items-center rounded-md border bg-muted/50 p-1">
                                {statusOptions.map((option, idx) => {
                                    const isActive = (status || '').toLowerCase() === option.toLowerCase();
                                    const isPast = statusOptions.findIndex(o => o.toLowerCase() === (status || '').toLowerCase()) > idx;

                                    return (
                                        <div key={option} className="flex items-center">
                                            <div
                                                className={cn(
                                                    "px-3 py-1 text-sm font-medium rounded-sm transition-colors cursor-default capitalize",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground shadow-sm"
                                                        : isPast
                                                            ? "text-primary font-semibold"
                                                            : "text-muted-foreground"
                                                )}
                                            >
                                                {option}
                                            </div>
                                            {idx < statusOptions.length - 1 && (
                                                <div className="h-4 w-px bg-border mx-1" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {status && statusOptions.length === 0 && (
                            <Badge variant="outline" className="capitalize text-base px-3 py-1">{status}</Badge>
                        )}
                    </div>
                </Card>
            )}

            {/* Main Content */}
            <div className="space-y-6">
                {children}
            </div>
        </div>
    );
}
