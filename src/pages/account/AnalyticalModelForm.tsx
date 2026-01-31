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
import { analyticalRuleStore, costCenterStore, productStore } from '@/services/mockData';
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
  const rule = id ? analyticalRuleStore.getById(id) : null;
  const costCenters = costCenterStore.getActive();
  const products = productStore.getActive();

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', ruleType: 'category', costCenterId: '', priority: 0, enabled: true },
  });

  const ruleType = watch('ruleType');

  useEffect(() => {
    if (rule) reset({
      name: rule.name,
      ruleType: rule.ruleType,
      productId: rule.productId ?? '',
      category: rule.category ?? '',
      costCenterId: rule.costCenterId,
      priority: rule.priority,
      enabled: rule.enabled,
    });
  }, [rule, reset]);

  const onSubmit = (data: FormValues) => {
    const payload = {
      name: data.name,
      ruleType: data.ruleType,
      productId: data.ruleType === 'product' ? data.productId : undefined,
      category: data.ruleType === 'category' ? (data.category as ProductCategory) : undefined,
      costCenterId: data.costCenterId,
      priority: data.priority,
      enabled: data.enabled,
    };
    if (isEdit && id) {
      analyticalRuleStore.update(id, payload);
      toast({ title: 'Updated', description: 'Rule updated successfully.' });
    } else {
      analyticalRuleStore.create(payload);
      toast({ title: 'Created', description: 'Rule created successfully.' });
    }
    navigate('/account/analytical-models');
  };

  if (isEdit && !rule) {
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
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
              <Label htmlFor="priority">Priority (lower = higher priority)</Label>
              <Input id="priority" type="number" {...register('priority')} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="enabled" {...register('enabled')} className="rounded border-input" />
              <Label htmlFor="enabled">Enabled</Label>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" asChild><Link to="/account/analytical-models">Cancel</Link></Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
