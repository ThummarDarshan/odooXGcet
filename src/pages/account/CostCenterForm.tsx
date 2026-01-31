import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCostCenter, useCreateCostCenter, useUpdateCostCenter } from '@/hooks/useData';
import type { CostCenter } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type FormValues = z.infer<typeof schema>;

export default function CostCenterForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const { data: remoteCostCenter, isLoading: isLoadingCostCenter } = useCostCenter(id);
  const { mutate: createCostCenter, isPending: isCreating } = useCreateCostCenter();
  const { mutate: updateCostCenter, isPending: isUpdating } = useUpdateCostCenter();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', code: '', description: '', status: 'active' },
  });

  useEffect(() => {
    if (remoteCostCenter) {
      reset({
        name: remoteCostCenter.name,
        code: remoteCostCenter.code || '',
        description: remoteCostCenter.description || '',
        status: remoteCostCenter.status as 'active' | 'inactive'
      });
    }
  }, [remoteCostCenter, reset]);

  const onSubmit = (data: FormValues) => {
    if (isEdit && id) {
      updateCostCenter({ id, data }, {
        onSuccess: () => {
          toast({ title: 'Updated', description: 'Cost center updated successfully.' });
          navigate('/account/cost-centers');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to update cost center.', variant: 'destructive' })
      });
    } else {
      createCostCenter(data, {
        onSuccess: () => {
          toast({ title: 'Created', description: 'Cost center created successfully.' });
          navigate('/account/cost-centers');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to create cost center.', variant: 'destructive' })
      });
    }
  };

  if (isEdit && isLoadingCostCenter) {
    return <div className="p-8 text-center text-muted-foreground">Loading cost center...</div>;
  }

  if (isEdit && !remoteCostCenter && !isLoadingCostCenter) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cost center not found.</p>
        <Button asChild variant="link"><Link to="/account/cost-centers">Back to Cost Centers</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">{isEdit ? 'Edit Cost Center' : 'New Cost Center'}</h1>
      <p className="text-muted-foreground mb-6">Name and description for budget tracking.</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Cost center details</CardTitle>
            <CardDescription>Name, code, description, status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} placeholder="e.g. Operations" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" {...register('code')} placeholder="e.g. OPR-001" />
                {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input id="description" {...register('description')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" loading={isCreating || isUpdating}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" asChild><Link to="/account/cost-centers">Cancel</Link></Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
