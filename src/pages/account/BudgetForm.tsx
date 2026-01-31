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

export default function BudgetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const { data: remoteBudget, isLoading: isLoadingBudget } = useBudget(id);
  const { data: costCenters = [] } = useCostCenters();
  const { mutate: createBudget, isPending: isCreating } = useCreateBudget();
  const { mutate: updateBudget, isPending: isUpdating } = useUpdateBudget();
  // Using update for archive (changing status) or delete if desired
  // Backend service allows status update now. Frontend useArchiveBudget uses delete. 
  // Let's stick to update status to ARCHIVED for consistency with UI "Archive".

  const [budget, setBudget] = useState<Budget | undefined>();

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', costCenterId: '', type: 'EXPENSE', periodStart: '', periodEnd: '', plannedAmount: 0 },
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

  const onSubmit = (data: FormValues) => {
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
      // Create new version
      const nextVersion = (budget.version || 1) + 1;
      const payload = {
        name: `${budget.name} (v${nextVersion})`,
        costCenterId: budget.costCenterId,
        type: budget.type,
        periodStart: budget.periodStart,
        periodEnd: budget.periodEnd,
        plannedAmount: budget.plannedAmount,
        description: `Revision of ${budget.name}`,
        revisionOfId: id,
        version: nextVersion
      };

      createBudget(payload, {
        onSuccess: (newBudget: any) => {
          updateBudget({ id, data: { status: 'REVISED' } });
          toast({ title: 'Revised', description: `Created version ${nextVersion}.` });
          navigate(`/account/budgets/${newBudget.id}/edit`);
        }
      });
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
    return <div className="p-8 text-center text-muted-foreground">Loading budget...</div>;
  }

  if (isEdit && !budget && !isLoadingBudget) {
    return <div className="text-center py-12 text-muted-foreground">Budget not found.</div>;
  }

  // Only editable in 'draft' stage
  const isReadOnly = isEdit && budget?.stage !== 'draft';

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
              <Button variant="outline" onClick={handleRevise}>Revise</Button>
              <Button variant="secondary" onClick={handleArchive}>Archive</Button>
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
                    disabled={isReadOnly}
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
                    disabled={isReadOnly}
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
                    <Input
                      id="plannedAmount"
                      type="number"
                      step="0.01"
                      {...register('plannedAmount')}
                      disabled={isReadOnly}
                      className="pl-5 font-bold text-base h-9 border-0 border-b rounded-none pr-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/30"
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
                    <Input id="periodStart" type="date" className="h-9 text-xs bg-muted/30" {...register('periodStart')} disabled={isReadOnly} />
                    {errors.periodStart && <p className="text-[11px] text-destructive">{errors.periodStart.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="periodEnd" className="text-xs font-medium text-muted-foreground">End Date</Label>
                    <Input id="periodEnd" type="date" className="h-9 text-xs bg-muted/30" {...register('periodEnd')} disabled={isReadOnly} />
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
