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
import { budgetStore, costCenterStore } from '@/services/mockData';
import { DocumentLayout } from '@/components/layout/DocumentLayout';
import { Badge } from '@/components/ui/badge';
import type { Budget } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  costCenterId: z.string().min(1, 'Cost center is required'),
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
  const [budget, setBudget] = useState<Budget | undefined>(id ? budgetStore.getById(id) : undefined);
  const costCenters = costCenterStore.getActive();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', costCenterId: '', periodStart: '', periodEnd: '', plannedAmount: 0 },
  });

  useEffect(() => {
    if (id) {
      setBudget(budgetStore.getById(id));
    } else {
      setBudget(undefined);
    }
  }, [id]);

  useEffect(() => {
    if (budget) reset({
      name: budget.name,
      costCenterId: budget.costCenterId,
      periodStart: budget.periodStart,
      periodEnd: budget.periodEnd,
      plannedAmount: budget.plannedAmount,
    });
  }, [budget, reset]);

  const onSubmit = (data: FormValues) => {
    if (isEdit && id) {
      budgetStore.update(id, data);
      toast({ title: 'Updated', description: 'Budget updated successfully.' });
    } else {
      // Create defaults
      const newBudget = budgetStore.create(data as any);
      toast({ title: 'Created', description: 'Budget created successfully.' });
      navigate('/account/budgets');
    }
  };

  const handleConfirm = () => {
    if (id) {
      budgetStore.confirm(id);
      setBudget(prev => prev ? ({ ...prev, stage: 'confirmed' }) : undefined);
      toast({ title: 'Confirmed', description: 'Budget is now active.' });
    }
  };

  const handleRevise = () => {
    if (id) {
      const newVersion = budgetStore.revise(id);
      if (newVersion) {
        toast({ title: 'Revised', description: `Created version ${newVersion.version}.` });
        navigate(`/account/budgets/${newVersion.id}/edit`);
      }
    }
  };

  const handleArchive = () => {
    if (id) {
      budgetStore.archive(id);
      setBudget(prev => prev ? ({ ...prev, stage: 'archived' }) : undefined);
      toast({ title: 'Archived', description: 'Budget archived.' });
    }
  };

  if (isEdit && !budget) {
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
          {!isReadOnly && <Button type="submit" form="budget-form">Save</Button>}

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
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium">Budget Name</Label>
              <Input
                id="name"
                {...register('name')}
                disabled={isReadOnly}
                className="text-xl font-bold h-12 border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50"
                placeholder="e.g. Q1 Marketing Campaign"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="costCenterId">Cost Center</Label>
                  <select
                    id="costCenterId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...register('costCenterId')}
                    disabled={isReadOnly}
                  >
                    <option value="">Select cost center</option>
                    {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                  </select>
                  {errors.costCenterId && <p className="text-sm text-destructive">{errors.costCenterId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plannedAmount" className="font-medium">Planned Amount</Label>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                    <Input
                      id="plannedAmount"
                      type="number"
                      step="0.01"
                      {...register('plannedAmount')}
                      disabled={isReadOnly}
                      className="pl-6 font-bold text-lg border-0 border-b rounded-none pr-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.plannedAmount && <p className="text-sm text-destructive">{errors.plannedAmount.message}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="periodStart">Start Date</Label>
                    <Input id="periodStart" type="date" {...register('periodStart')} disabled={isReadOnly} />
                    {errors.periodStart && <p className="text-sm text-destructive">{errors.periodStart.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodEnd">End Date</Label>
                    <Input id="periodEnd" type="date" {...register('periodEnd')} disabled={isReadOnly} />
                    {errors.periodEnd && <p className="text-sm text-destructive">{errors.periodEnd.message}</p>}
                  </div>
                </div>

                {budget && budget.revisionOfId && (
                  <div className="p-4 bg-muted/30 rounded-lg border text-sm">
                    <span className="font-medium">Revision of: </span>
                    <span className="text-muted-foreground">Original Budget (ID: {budget.revisionOfId})</span>
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
