import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useBudget, useCreateBudget, useUpdateBudget, useArchiveBudget, useCostCenters } from '@/hooks/useData';
import { DocumentLayout } from '@/components/layout/DocumentLayout';
import { useQueryClient } from '@tanstack/react-query';
import type { Budget } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  costCenterId: z.string().min(1, 'Cost center is required'),
  type: z.enum(['INCOME', 'EXPENSE']),
  periodStart: z.string().min(1, 'Start date required'),
  periodEnd: z.string().min(1, 'End date required'),
  plannedAmount: z.coerce.number().min(0, 'Planned amount must be ≥ 0'),
}).refine(data => !data.periodStart || !data.periodEnd || data.periodEnd >= data.periodStart, {
  message: 'End date must be on or after start date',
  path: ['periodEnd'],
});

type FormValues = z.infer<typeof schema>;

import { Skeleton } from '@/components/ui/skeleton';

export default function BudgetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const { data: remoteBudget, isLoading: isLoadingBudget, isError: isBudgetError } = useBudget(id);
  const { data: costCenters = [] } = useCostCenters();
  const { mutate: createBudget, isPending: isCreating } = useCreateBudget();
  const { mutate: updateBudget, isPending: isUpdating } = useUpdateBudget();
  // Using update for archive (changing status) or delete if desired
  // Backend service allows status update now. Frontend useArchiveBudget uses delete. 
  // Let's stick to update status to ARCHIVED for consistency with UI "Archive".

  const [budget, setBudget] = useState<Budget | undefined>();
  const [isRevising, setIsRevising] = useState(false);
  const [isStartingRevision, setIsStartingRevision] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      costCenterId: '',
      type: 'EXPENSE',
      periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12).toISOString().slice(0, 10), // Default to 1st of month. Noon to avoid timezone boundary issues.
      periodEnd: '',
      plannedAmount: 0
    },
  });

  useEffect(() => {
    if (remoteBudget) {
      setBudget(remoteBudget);
      reset({
        name: remoteBudget.name,
        costCenterId: remoteBudget.costCenterId,
        type: remoteBudget.type || 'EXPENSE',
        periodStart: remoteBudget.periodStart ? new Date(remoteBudget.periodStart).toISOString().slice(0, 10) : '',
        periodEnd: remoteBudget.periodEnd ? new Date(remoteBudget.periodEnd).toISOString().slice(0, 10) : '',
        plannedAmount: remoteBudget.plannedAmount,
      });
    }
  }, [remoteBudget, reset]);

  useEffect(() => {
    if (isEdit && (isBudgetError || (!budget && !remoteBudget && !isLoadingBudget))) {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    }
  }, [isEdit, isBudgetError, budget, remoteBudget, isLoadingBudget, queryClient]);

  const onSubmit = (data: FormValues) => {
    if (isRevising && id && budget) {
      const nextVersion = (budget.version || 1) + 1;
      const payload = {
        ...data,
        name: budget.name, // Keep original parameters
        costCenterId: budget.costCenterId,
        type: budget.type,
        periodStart: budget.periodStart,
        periodEnd: budget.periodEnd,
        revisionOfId: id,
        version: nextVersion,
        status: 'ACTIVE' // Save as confirmed immediately
      };

      createBudget(payload, {
        onSuccess: (newBudget: any) => {
          // Mark old version as REVISED
          updateBudget({ id, data: { status: 'REVISED' } });
          toast({ title: 'Revision Saved', description: `New version ${nextVersion} created.` });
          setIsRevising(false);
          navigate(`/account/budgets/${newBudget.id}`);
        },
        onError: () => toast({ title: 'Error', description: 'Failed to save revision.', variant: 'destructive' })
      });
      return;
    }

    if (isEdit && id) {
      updateBudget({ id, data }, {
        onSuccess: () => {
          toast({ title: 'Updated', description: 'Budget updated successfully.' });
          navigate('/account/budgets');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to update budget.', variant: 'destructive' })
      });
    } else {
      createBudget(data, {
        onSuccess: () => {
          toast({ title: 'Created', description: 'Budget created successfully.' });
          navigate('/account/budgets');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to create budget.', variant: 'destructive' })
      });
    }
  };

  const handleConfirm = () => {
    if (id) {
      updateBudget({ id, data: { status: 'confirmed' } }, {
        onSuccess: () => {
          toast({ title: 'Confirmed', description: 'Budget is now active.' });
          setBudget(prev => prev ? ({ ...prev, stage: 'confirmed' }) : undefined);
        }
      });
    }
  };

  const handleRevise = () => {
    if (id && budget) {
      setIsStartingRevision(true);
      // Simulate/Show loading animation to prevent multiple clicks and satisfy user request
      setTimeout(() => {
        setIsRevising(true);
        setIsStartingRevision(false);
        toast({
          title: 'Revision Mode',
          description: 'You can now update the planned amount for this budget.'
        });
      }, 700);
    }
  };

  const handleArchive = () => {
    if (id) {
      // Logic: Update status to ARCHIVED
      updateBudget({ id, data: { status: 'archived' } }, {
        onSuccess: () => {
          toast({ title: 'Archived', description: 'Budget archived.' });
          setBudget(prev => prev ? ({ ...prev, stage: 'archived' }) : undefined);
          navigate('/account/budgets');
        }
      });
    }
  };

  if (isEdit && isLoadingBudget) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-8">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }



  if (isEdit && (isBudgetError || (!budget && !remoteBudget && !isLoadingBudget))) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-destructive mb-2">Budget Not Found</h3>
        <p className="text-muted-foreground mb-4">The requested budget could not be found.</p>
        <Button onClick={() => navigate('/account/budgets')}>Back to Budgets</Button>
      </div>
    );
  }

  // Only editable in 'draft' stage OR when revising
  const isReadOnly = isEdit && budget?.stage !== 'draft' && !isRevising;
  const isFieldFixed = isEdit && budget?.stage !== 'draft'; // Fixed for everything except amount in revision mode

  return (
    <DocumentLayout
      title={isEdit ? budget?.name ?? 'Budget' : 'New Budget'}
      subtitle={budget ? `Version ${budget.version ?? 1} • ${(budget.stage || 'draft').toUpperCase()}` : 'Draft'}
      backTo="/account/budgets"
      status={budget?.stage || 'draft'}
      statusOptions={['Draft', 'Confirmed', 'Revised', 'Archived']}
      actions={
        <>
          {!isReadOnly && <Button type="submit" form="budget-form" loading={isCreating || isUpdating}>Save</Button>}

          {budget?.stage === 'draft' && isEdit && (
            <Button variant="default" onClick={handleConfirm} className="bg-teal-700 hover:bg-teal-800">Confirm</Button>
          )}

          {budget?.stage === 'confirmed' && (
            <>
              {!isRevising && (
                <Button
                  variant="outline"
                  onClick={handleRevise}
                  loading={isStartingRevision}
                  className="transition-all duration-300"
                >
                  Revise
                </Button>
              )}
              {isRevising && (
                <Button type="submit" form="budget-form" loading={isCreating || isUpdating}>
                  Save Revision
                </Button>
              )}
              {!isRevising && <Button variant="secondary" onClick={handleArchive}>Archive</Button>}
            </>
          )}

          {budget?.stage === 'revised' && budget.nextVersionId && (
            <Button variant="default" onClick={() => navigate(`/account/budgets/${budget.nextVersionId}/edit`)}>
              View New Version
            </Button>
          )}
        </>
      }
    >
      <form id="budget-form" onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-none sm:border shadow-none sm:shadow-sm">
          <CardContent className="pt-4 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Budget Name</Label>
              <Input
                id="name"
                {...register('name')}
                disabled={isReadOnly}
                className="text-lg font-bold h-10 border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/30"
                placeholder="e.g. Q1 Marketing Campaign"
              />
              {errors.name && <p className="text-[11px] text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="costCenterId" className="text-xs font-medium text-muted-foreground">Cost Center</Label>
                  <select
                    id="costCenterId"
                    className="flex h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-1 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    {...register('costCenterId')}
                    disabled={isFieldFixed}
                  >
                    <option value="">Select cost center</option>
                    {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                  </select>
                  {errors.costCenterId && <p className="text-[11px] text-destructive">{errors.costCenterId.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-xs font-medium text-muted-foreground">Budget Type</Label>
                  <select
                    id="type"
                    className="flex h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-1 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    {...register('type')}
                    disabled={isFieldFixed}
                  >
                    <option value="EXPENSE">Expense (Vendor Bills)</option>
                    <option value="INCOME">Income (Sales Invoices)</option>
                  </select>
                  {errors.type && <p className="text-[11px] text-destructive">{errors.type.message}</p>}
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="plannedAmount" className="text-xs font-medium text-muted-foreground">Planned Amount</Label>
                  <div className="relative group">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 font-bold text-muted-foreground/50 transition-colors group-focus-within:text-primary">₹</span>
                    <input
                      id="plannedAmount"
                      type="number"
                      step="0.01"
                      {...register('plannedAmount')}
                      disabled={isReadOnly}
                      className="w-full pl-5 font-bold text-base h-9 border-0 border-b bg-transparent rounded-none pr-0 focus:outline-none focus:border-primary placeholder:text-muted-foreground/30 disabled:opacity-50"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.plannedAmount && <p className="text-[11px] text-destructive">{errors.plannedAmount.message}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="periodStart" className="text-xs font-medium text-muted-foreground">Start Date</Label>
                    <Input id="periodStart" type="date" className="h-9 text-xs bg-muted/30" {...register('periodStart')} disabled={isFieldFixed} />
                    {errors.periodStart && <p className="text-[11px] text-destructive">{errors.periodStart.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="periodEnd" className="text-xs font-medium text-muted-foreground">End Date</Label>
                    <Input id="periodEnd" type="date" className="h-9 text-xs bg-muted/30" {...register('periodEnd')} disabled={isFieldFixed} />
                    {errors.periodEnd && <p className="text-[11px] text-destructive">{errors.periodEnd.message}</p>}
                  </div>
                </div>

                {budget && budget.revisionOfId && (
                  <div className="p-3 bg-muted/50 rounded-md border border-dashed text-[11px] flex justify-between items-center mt-2">
                    <span className="font-semibold text-muted-foreground uppercase tracking-tighter">Budget Origin</span>
                    <span className="font-mono text-primary/70">{budget.revisionOfId.slice(0, 8)}...</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </DocumentLayout>
  );
}
