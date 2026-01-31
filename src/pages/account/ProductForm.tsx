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
import { useProduct, useCreateProduct, useUpdateProduct, useArchiveProduct } from '@/hooks/useData';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { DocumentLayout } from '@/components/layout/DocumentLayout';
import type { Product } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().min(0, 'Price must be ≥ 0'),
  purchasePrice: z.coerce.number().min(0, 'Purchase Price must be ≥ 0'),
  status: z.enum(['confirmed', 'archived']),
});

type FormValues = z.infer<typeof schema>;

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const { data: remoteProduct, isLoading: isLoadingProduct } = useProduct(id);
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const { mutate: archiveProduct } = useArchiveProduct();

  const [product, setProduct] = useState<Product | undefined>();

  // Custom Category State
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      category: 'sofa',
      price: 0,
      purchasePrice: 0,
      status: 'confirmed'
    },
  });

  const selectedCategory = watch('category');
  const status = watch('status');

  useEffect(() => {
    if (remoteProduct) {
      setProduct(remoteProduct);
      reset({
        name: remoteProduct.name,
        category: remoteProduct.category,
        price: remoteProduct.price,
        purchasePrice: remoteProduct.purchasePrice,
        status: (remoteProduct.status as 'confirmed' | 'archived') || 'confirmed'
      });
      // Check if category is custom
      const isStandard = PRODUCT_CATEGORIES.some(c => c.value === remoteProduct.category);
      if (!isStandard && remoteProduct.category) {
        setIsCustomCategory(true);
        setCustomCategory(remoteProduct.category);
      }
    }
  }, [remoteProduct, reset]);

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
    if (isEdit && id) {
      updateProduct({ id, data }, {
        onSuccess: () => {
          toast({ title: 'Updated', description: 'Product updated successfully.' });
          navigate('/account/products');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to update product', variant: 'destructive' })
      });
    } else {
      createProduct(data, {
        onSuccess: () => {
          toast({ title: 'Created', description: 'Product created successfully.' });
          navigate('/account/products');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to create product', variant: 'destructive' })
      });
    }
  };

  const handleConfirm = () => {
    if (id) {
      updateProduct({ id, data: { status: 'confirmed' } }, {
        onSuccess: () => {
          toast({ title: 'Confirmed', description: 'Product confirmed.' });
          setValue('status', 'confirmed');
          setProduct(prev => prev ? ({ ...prev, status: 'confirmed' }) : undefined);
        }
      });
    } else {
      setValue('status', 'confirmed');
    }
  };

  const handleArchive = () => {
    if (id) {
      // Using archiveProduct which does DELETE /products/:id which soft deletes
      archiveProduct(id, {
        onSuccess: () => {
          toast({ title: 'Archived', description: 'Product archived.' });
          setValue('status', 'archived');
          setProduct(prev => prev ? ({ ...prev, status: 'archived' }) : undefined);
          navigate('/account/products');
        }
      });
    } else {
      setValue('status', 'archived');
      navigate('/account/products');
    }
  };

  if (isEdit && isLoadingProduct) {
    return <div className="p-8 text-center text-muted-foreground">Loading product...</div>;
  }

  if (isEdit && !remoteProduct && !isLoadingProduct) {
    return <div className="text-center py-12"><p className="text-muted-foreground">Product not found.</p></div>;
  }

  const isReadOnly = status === 'archived';

  return (
    <DocumentLayout
      title={isEdit ? product?.name ?? 'Product' : 'New Product'}
      subtitle={isEdit ? 'Product Details' : undefined}
      backTo="/account/products"
      status={status}
      statusOptions={['Confirmed', 'Archived']}
      actions={
        <>
          <Button type="submit" form="product-form" loading={isCreating || isUpdating}>Save</Button>
          {status === 'archived' ? (
            <Button variant="default" onClick={handleConfirm} className="bg-teal-700 hover:bg-teal-800">Restore</Button>
          ) : (
            isEdit && <Button variant="secondary" onClick={handleArchive}>Archive</Button>
          )}
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
