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
import { productStore } from '@/services/mockData';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import type { ProductCategory } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string() as z.ZodType<ProductCategory>,
  price: z.coerce.number().min(0, 'Price must be ≥ 0'),
  status: z.enum(['active', 'archived']),
});

type FormValues = z.infer<typeof schema>;

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);
  const product = id ? productStore.getById(id) : null;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', category: 'sofa', price: 0, status: 'active' },
  });

  useEffect(() => {
    if (product) reset({ name: product.name, category: product.category, price: product.price, status: product.status });
  }, [product, reset]);

  const onSubmit = (data: FormValues) => {
    if (isEdit && id) {
      productStore.update(id, data);
      toast({ title: 'Updated', description: 'Product updated successfully.' });
    } else {
      productStore.create(data);
      toast({ title: 'Created', description: 'Product created successfully.' });
    }
    navigate('/account/products');
  };

  if (isEdit && !product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found.</p>
        <Button asChild variant="link"><Link to="/account/products">Back to Products</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">{isEdit ? 'Edit Product' : 'New Product'}</h1>
      <p className="text-muted-foreground mb-6">Product name, category, and price.</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Product details</CardTitle>
            <CardDescription>Name, category, price, status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select id="category" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('category')}>
                {PRODUCT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input id="price" type="number" step="0.01" {...register('price')} />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('status')}>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" asChild><Link to="/account/products">Cancel</Link></Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
