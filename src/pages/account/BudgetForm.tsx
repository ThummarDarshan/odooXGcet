import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { budgetStore, costCenterStore } from '@/services/mockData';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  costCenterId: z.string().min(1, 'Cost center is required'),
  periodStart: z.string().min(1, 'Start date required'),
  periodEnd: z.string().min(1, 'End date required'),
  plannedAmount: z.coerce.number().min(0, 'Planned amount must be ≥ 0'),
});

type FormValues = z.infer<typeof schema>;

export default function BudgetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);
  const budget = id ? budgetStore.getById(id) : null;
  const costCenters = costCenterStore.getActive();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', costCenterId: '', periodStart: '', periodEnd: '', plannedAmount: 0 },
  });

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
      budgetStore.create(data);
      toast({ title: 'Created', description: 'Budget created successfully.' });
    }
    navigate('/account/budgets');
  };

  if (isEdit && !budget) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Budget not found.</p>
        <Button asChild variant="link"><Link to="/account/budgets">Back to Budgets</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">{isEdit ? 'Edit Budget' : 'New Budget'}</h1>
      <p className="text-muted-foreground mb-6">Link a cost center to a period and planned amount.</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Budget details</CardTitle>
            <CardDescription>Name, cost center, period, planned amount</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="costCenterId">Cost Center</Label>
              <select id="costCenterId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('costCenterId')}>
                <option value="">Select cost center</option>
                {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
              </select>
              {errors.costCenterId && <p className="text-sm text-destructive">{errors.costCenterId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Period Start</Label>
                <Input id="periodStart" type="date" {...register('periodStart')} />
                {errors.periodStart && <p className="text-sm text-destructive">{errors.periodStart.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEnd">Period End</Label>
                <Input id="periodEnd" type="date" {...register('periodEnd')} />
                {errors.periodEnd && <p className="text-sm text-destructive">{errors.periodEnd.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plannedAmount">Planned Amount (₹)</Label>
              <Input id="plannedAmount" type="number" step="0.01" {...register('plannedAmount')} />
              {errors.plannedAmount && <p className="text-sm text-destructive">{errors.plannedAmount.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" asChild><Link to="/account/budgets">Cancel</Link></Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
