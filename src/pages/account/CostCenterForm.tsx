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
import { costCenterStore } from '@/services/mockData';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  status: z.enum(['active', 'inactive']),
});

type FormValues = z.infer<typeof schema>;

export default function CostCenterForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);
  const costCenter = id ? costCenterStore.getById(id) : null;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', status: 'active' },
  });

  useEffect(() => {
    if (costCenter) reset({ name: costCenter.name, description: costCenter.description, status: costCenter.status });
  }, [costCenter, reset]);

  const onSubmit = (data: FormValues) => {
    if (isEdit && id) {
      costCenterStore.update(id, data);
      toast({ title: 'Updated', description: 'Cost center updated successfully.' });
    } else {
      costCenterStore.create(data);
      toast({ title: 'Created', description: 'Cost center created successfully.' });
    }
    navigate('/account/cost-centers');
  };

  if (isEdit && !costCenter) {
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
            <CardDescription>Name, description, status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" asChild><Link to="/account/cost-centers">Cancel</Link></Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
