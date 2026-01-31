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
import { contactStore } from '@/services/mockData';
import type { ContactType } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string(),
  type: z.enum(['customer', 'vendor']),
  portalAccess: z.boolean(),
  status: z.enum(['active', 'archived']).default('active'),
});

type FormValues = z.infer<typeof schema>;

export default function ContactForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const contact = id ? contactStore.getById(id) : null;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      type: 'customer',
      portalAccess: false,
      status: 'active',
    },
  });

  useEffect(() => {
    if (contact) {
      reset({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
        type: contact.type,
        portalAccess: contact.portalAccess,
        status: contact.status,
      });
    }
  }, [contact, reset]);

  const onSubmit = (data: FormValues) => {
    if (isEdit && id) {
      contactStore.update(id, data);
      toast({ title: 'Updated', description: 'Contact updated successfully.' });
    } else {
      // Ensure all required fields are present
      const contactData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        type: data.type,
        portalAccess: data.portalAccess,
        status: data.status,
      };
      contactStore.create(contactData);
      toast({ title: 'Created', description: 'Contact created successfully.' });
    }
    navigate('/account/contacts');
  };

  if (isEdit && !contact) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Contact not found.</p>
        <Button asChild variant="link">
          <Link to="/account/contacts">Back to Contacts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">{isEdit ? 'Edit Contact' : 'New Contact'}</h1>
      <p className="text-muted-foreground mb-6">Fill in the contact details.</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Contact details</CardTitle>
            <CardDescription>Name, email, phone, and classification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select id="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('type')}>
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register('address')} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="portalAccess" {...register('portalAccess')} className="rounded border-input" />
              <Label htmlFor="portalAccess">Enable customer portal access</Label>
            </div>
            <input type="hidden" {...register('status')} />
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/account/contacts">Cancel</Link>
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
