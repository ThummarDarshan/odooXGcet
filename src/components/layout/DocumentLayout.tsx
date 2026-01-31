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
        <div className={cn("flex flex-col gap-4 max-w-5xl mx-auto w-full", className)}>
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                {backTo && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-fit -ml-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(backTo)}
                    >
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                        {backText}
                    </Button>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
                        {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
                    </div>

                    <div className="flex items-center gap-1.5">
                        {actions}
                    </div>
                </div>
            </div>

            {/* Status Pipeline & Action Bar */}
            {(status || (statusOptions.length > 0)) && (
                <Card className="rounded-md shadow-none border overflow-hidden bg-muted/20">
                    <div className="flex flex-wrap items-center justify-between p-2 sm:px-3 gap-3">
                        <div className="flex-1 overflow-hidden">
                            {/* Workflow actions could be here, currently parent handles buttons */}
                        </div>

                        {/* Status Pipeline */}
                        {statusOptions.length > 0 && (
                            <div className="flex items-center rounded border bg-background/50 p-0.5">
                                {statusOptions.map((option, idx) => {
                                    const isActive = (status || '').toLowerCase() === option.toLowerCase();
                                    const isPast = statusOptions.findIndex(o => o.toLowerCase() === (status || '').toLowerCase()) > idx;

                                    return (
                                        <div key={option} className="flex items-center">
                                            <div
                                                className={cn(
                                                    "px-2.5 py-0.5 text-[11px] font-semibold rounded-sm transition-colors cursor-default capitalize",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground shadow-xs"
                                                        : isPast
                                                            ? "text-primary/80"
                                                            : "text-muted-foreground/60"
                                                )}
                                            >
                                                {option}
                                            </div>
                                            {idx < statusOptions.length - 1 && (
                                                <div className="h-3 w-px bg-border/60 mx-0.5" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {status && statusOptions.length === 0 && (
                            <Badge variant="outline" className="capitalize text-xs px-2 py-0 h-5 font-medium">{status}</Badge>
                        )}
                    </div>
                </Card>
            )}

            {/* Main Content */}
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}
