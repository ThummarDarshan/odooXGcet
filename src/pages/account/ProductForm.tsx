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
import { productStore } from '@/services/mockData';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { DocumentLayout } from '@/components/layout/DocumentLayout';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().min(0, 'Price must be ≥ 0'),
  purchasePrice: z.coerce.number().min(0, 'Purchase Price must be ≥ 0'),
  status: z.enum(['draft', 'confirmed', 'archived']),
});

type FormValues = z.infer<typeof schema>;

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);
  const [product, setProduct] = useState(id ? productStore.getById(id) : null);

  // Custom Category State
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      category: product?.category ?? 'sofa',
      price: product?.price ?? 0,
      purchasePrice: product?.purchasePrice ?? 0,
      status: product?.status ?? 'draft'
    },
  });

  const selectedCategory = watch('category');
  const status = watch('status');

  useEffect(() => {
    if (id) {
      setProduct(productStore.getById(id));
    }
  }, [id]);

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        category: product.category,
        price: product.price,
        purchasePrice: product.purchasePrice,
        status: product.status
      });
      // Check if category is custom
      const isStandard = PRODUCT_CATEGORIES.some(c => c.value === product.category);
      if (!isStandard && product.category) {
        setIsCustomCategory(true);
        setCustomCategory(product.category);
      }
    }
  }, [product, reset]);

  // Handle "Create New..." selection
  useEffect(() => {
    if (selectedCategory === 'custom_new') {
      setIsCustomCategory(true);
      setValue('category', ''); // Clear for custom input
    } else if (selectedCategory && selectedCategory !== 'custom_new' && !isCustomCategory) {
      // Standard selection
    }
  }, [selectedCategory, isCustomCategory, setValue]);


  const onSubmit = (data: FormValues) => {
    // If custom category, use that value (it's bound to 'category' via register if using input)
    // Actually, if isCustomCategory is true, we should ensure data.category comes from the custom input?
    // See rendering logic below.

    if (isEdit && id) {
      productStore.update(id, data);
      toast({ title: 'Updated', description: 'Product updated successfully.' });
    } else {
      const newProduct = productStore.create(data as any);
      toast({ title: 'Created', description: 'Product created successfully.' });
      navigate('/account/products');
    }
  };

  const handleConfirm = () => {
    if (id) {
      productStore.update(id, { status: 'confirmed' });
      setValue('status', 'confirmed');
      setProduct(prev => prev ? ({ ...prev, status: 'confirmed' }) : null);
      toast({ title: 'Confirmed', description: 'Product confirmed.' });
    }
  };

  const handleArchive = () => {
    if (id) {
      productStore.archive(id);
      setValue('status', 'archived');
      setProduct(prev => prev ? ({ ...prev, status: 'archived' }) : null);
      toast({ title: 'Archived', description: 'Product archived.' });
    }
  };

  if (isEdit && !product) {
    return <div className="text-center py-12"><p className="text-muted-foreground">Product not found.</p></div>;
  }

  const isReadOnly = status === 'archived';

  return (
    <DocumentLayout
      title={isEdit ? product?.name ?? 'Product' : 'New Product'}
      subtitle={isEdit ? 'Product Details' : undefined}
      backTo="/account/products"
      status={status}
      statusOptions={['Draft', 'Confirmed', 'Archived']}
      actions={
        <>
          {!isEdit && <Button type="submit" form="product-form">Save</Button>}
          {isEdit && status !== 'archived' && (
            <Button type="submit" form="product-form">Save</Button>
          )}
          {isEdit && status === 'draft' && (
            <Button variant="default" onClick={handleConfirm} className="bg-teal-700 hover:bg-teal-800">Confirm</Button>
          )}
          {status !== 'archived' && isEdit && (
            <Button variant="secondary" onClick={handleArchive}>Archive</Button>
          )}
          {/* Restore option could be added here for archived products */}
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit(onSubmit)}>
        <Card className="min-h-[400px]">
          <CardContent className="pt-8 space-y-8">
            {/* Product Name */}
            <div className="space-y-2">
              <Label className="font-medium">Product Name</Label>
              <Input
                disabled={isReadOnly}
                {...register('name')}
                className="text-xl font-bold h-12 border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50"
                placeholder="e.g. Executive Desk"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Left Column: Category */}
              <div className="space-y-6">
                <div className="space-y-2 relative">
                  <Label className="font-medium">Category</Label>
                  {!isCustomCategory ? (
                    <select
                      disabled={isReadOnly}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...register('category')}
                    >
                      {PRODUCT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      <option value="custom_new" className="font-bold text-primary">+ Create New Category...</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        disabled={isReadOnly}
                        {...register('category')}
                        placeholder="Enter new category name..."
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setIsCustomCategory(false);
                          setValue('category', 'sofa'); // Reset to default
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    *Select "Create New Category" to add a custom one on the fly.
                  </p>
                </div>
              </div>

              {/* Right Column: Pricing */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-2">
                  <Label className="font-medium">Sales Price</Label>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-muted-foreground">₹</span>
                    <Input
                      disabled={isReadOnly}
                      type="number"
                      step="0.01"
                      className="w-32 text-right font-bold border-none bg-transparent h-8 p-0 focus-visible:ring-0"
                      {...register('price')}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}

                <div className="flex items-center justify-between border-b pb-2">
                  <Label className="font-medium">Purchase Price</Label>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground">₹</span>
                    <Input
                      disabled={isReadOnly}
                      type="number"
                      step="0.01"
                      className="w-32 text-right font-medium text-muted-foreground border-none bg-transparent h-8 p-0 focus-visible:ring-0"
                      {...register('purchasePrice')}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {errors.purchasePrice && <p className="text-sm text-destructive">{errors.purchasePrice.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </DocumentLayout>
  );
}
