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
import { useAnalyticalRule, useCreateAnalyticalRule, useUpdateAnalyticalRule, useCostCenters, useProducts } from '@/hooks/useData';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import type { ProductCategory } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  ruleType: z.enum(['product', 'category']),
  productId: z.string().optional(),
  category: z.string().optional(),
  costCenterId: z.string().min(1, 'Cost center is required'),
  priority: z.coerce.number().min(0),
  enabled: z.boolean(),
}).refine(data => {
  if (data.ruleType === 'product') return !!data.productId;
  if (data.ruleType === 'category') return !!data.category;
  return true;
}, { message: 'Select product or category', path: ['productId'] });

type FormValues = z.infer<typeof schema>;

export default function AnalyticalModelForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const { data: remoteRule, isLoading: isLoadingRule } = useAnalyticalRule(id);
  const { data: costCenters = [] } = useCostCenters();
  const { data: products = [] } = useProducts({ limit: 100, status: 'active' });

  const { mutate: createRule, isPending: isCreating } = useCreateAnalyticalRule();
  const { mutate: updateRule, isPending: isUpdating } = useUpdateAnalyticalRule();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', ruleType: 'category', costCenterId: '', priority: 0, enabled: true },
  });

  const ruleType = watch('ruleType');

  useEffect(() => {
    if (remoteRule) {
      reset({
        name: remoteRule.name,
        ruleType: remoteRule.ruleType as 'product' | 'category',
        productId: remoteRule.productId ?? '',
        category: remoteRule.category ?? '',
        costCenterId: remoteRule.costCenterId,
        priority: remoteRule.priority,
        enabled: remoteRule.enabled,
      });
    }
  }, [remoteRule, reset]);

  const onSubmit = (data: FormValues) => {
    // The hook handles payload mapping? No, the hook expects raw data or mapped data?
    // Let's check useData.ts hooks.
    // useCreateAnalyticalRule: expects object with { name, ruleType, productId, category, costCenterId, priority, enabled }
    // which matches our FormValues except ruleType string case?
    // useData: "priority_type: data.ruleType === 'product' ? 'PRODUCT' : 'CATEGORY'"
    // So if data.ruleType is 'product'/'category', it works.

    if (isEdit && id) {
      updateRule({ id, data }, {
        onSuccess: () => {
          toast({ title: 'Updated', description: 'Rule updated successfully.' });
          navigate('/account/analytical-models');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to update rule.', variant: 'destructive' })
      });
    } else {
      createRule(data, {
        onSuccess: () => {
          toast({ title: 'Created', description: 'Rule created successfully.' });
          navigate('/account/analytical-models');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to create rule.', variant: 'destructive' })
      });
    }
  };

  if (isEdit && isLoadingRule) {
    return <div className="p-8 text-center text-muted-foreground">Loading rule...</div>;
  }

  if (isEdit && !remoteRule && !isLoadingRule) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Rule not found.</p>
        <Button asChild variant="link"><Link to="/account/analytical-models">Back to Rules</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">{isEdit ? 'Edit Rule' : 'New Rule'}</h1>
      <p className="text-muted-foreground mb-6">Map product or category to a cost center.</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Rule details</CardTitle>
            <CardDescription>Type, product/category, cost center, priority</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input id="name" {...register('name')} placeholder="e.g. Sofa → Manufacturing" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ruleType">Type</Label>
              <select id="ruleType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('ruleType')}>
                <option value="product">Product</option>
                <option value="category">Category</option>
              </select>
            </div>
            {ruleType === 'product' && (
              <div className="space-y-2">
                <Label htmlFor="productId">Product</Label>
                <select id="productId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('productId')}>
                  <option value="">Select product</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            {ruleType === 'category' && (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select id="category" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('category')}>
                  <option value="">Select category</option>
                  {PRODUCT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="costCenterId">Cost Center</Label>
              <select id="costCenterId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('costCenterId')}>
                <option value="">Select cost center</option>
                {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
              </select>
              {errors.costCenterId && <p className="text-sm text-destructive">{errors.costCenterId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority (higher number = higher priority)</Label>
              <Input id="priority" type="number" {...register('priority')} />
              <p className="text-xs text-muted-foreground">Note: Backend uses higher number = higher priority.</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="enabled" {...register('enabled')} className="rounded border-input" />
              <Label htmlFor="enabled">Enabled</Label>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" loading={isCreating || isUpdating}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" asChild><Link to="/account/analytical-models">Cancel</Link></Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
