import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useContact, useCreateContact, useUpdateContact } from '@/hooks/useData';
import { DocumentLayout } from '@/components/layout/DocumentLayout';
import type { Contact } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  image: z.string().optional(),
  email: z.string().email('Valid email required'),
  phone: z.string().min(1, 'Phone is required'),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  type: z.enum(['customer', 'vendor']),
  tags: z.array(z.string()).optional(),
  portalAccess: z.boolean(),
  portalPassword: z.string().optional(),
  status: z.enum(['draft', 'confirmed', 'archived']),
});

type FormValues = z.infer<typeof schema>;

export default function ContactForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const { data: remoteContact, isLoading: isLoadingContact } = useContact(id);
  const { mutate: createContact, isPending: isCreating } = useCreateContact();
  const { mutate: updateContact, isPending: isUpdating } = useUpdateContact();

  const [contact, setContact] = useState<Contact | undefined>();
  const [tagInput, setTagInput] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      type: 'customer',
      tags: [],
      portalAccess: false,
      portalPassword: '',
      status: 'draft',
    },
  });

  const status = watch('status');

  useEffect(() => {
    if (remoteContact) {
      setContact(remoteContact);
      reset({
        name: remoteContact.name,
        email: remoteContact.email,
        phone: remoteContact.phone,
        street: remoteContact.street ?? '',
        city: remoteContact.city ?? '',
        state: remoteContact.state ?? '',
        country: remoteContact.country ?? '',
        pincode: remoteContact.pincode ?? '',
        type: remoteContact.type,
        tags: remoteContact.tags ?? [],
        portalAccess: remoteContact.portalAccess,
        status: remoteContact.status === 'confirmed' ? 'confirmed' : remoteContact.status === 'archived' ? 'archived' : 'draft',
      });
      setActiveTags(remoteContact.tags ?? []);
    }
  }, [remoteContact, reset]);

  // Sync activeTags with form
  useEffect(() => {
    setValue('tags', activeTags);
  }, [activeTags, setValue]);

  const addTag = () => {
    if (tagInput.trim() && !activeTags.includes(tagInput.trim())) {
      setActiveTags([...activeTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setActiveTags(activeTags.filter(t => t !== tag));
  };

  const handleConfirm = () => {
    if (id) {
      updateContact({ id, data: { status: 'confirmed' } }, {
        onSuccess: () => {
          toast({ title: 'Confirmed', description: 'Contact confirmed.' });
          setValue('status', 'confirmed');
        }
      });
    } else {
      setValue('status', 'confirmed');
    }
  };

  const handleArchive = () => {
    if (id) {
      updateContact({ id, data: { status: 'archived' } }, {
        onSuccess: () => {
          toast({ title: 'Archived', description: 'Contact archived.' });
          setValue('status', 'archived');
        }
      });
    } else {
      setValue('status', 'archived');
    }
  };

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      tagName: data.tags?.[0], // Backend expects 'tagName' for single tag logic, or we update backend to accept tags array
    };

    if (isEdit && id) {
      updateContact({ id, data: payload }, {
        onSuccess: () => {
          toast({ title: 'Updated', description: 'Contact updated successfully.' });
          navigate('/account/contacts');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to update contact', variant: 'destructive' })
      });
    } else {
      createContact(payload, {
        onSuccess: () => {
          toast({ title: 'Created', description: 'Contact created successfully.' });
          navigate('/account/contacts');
        },
        onError: () => toast({ title: 'Error', description: 'Failed to create contact', variant: 'destructive' })
      });
    }
  };

  if (isEdit && isLoadingContact) {
    return <div className="p-8 text-center text-muted-foreground">Loading contact...</div>;
  }

  if (isEdit && !remoteContact && !isLoadingContact) {
    return <div className="p-8 text-center text-muted-foreground">Contact not found</div>;
  }

  const isReadOnly = status === 'archived';

  return (
    <DocumentLayout
      title={watch('name') || 'New Contact'}
      subtitle={(watch('type') || 'customer').toUpperCase()}
      backTo="/account/contacts"
      status={status}
      statusOptions={['Draft', 'Confirmed', 'Archived']}
      actions={
        <>
          <Button type="submit" form="contact-form" loading={isCreating || isUpdating}>Save</Button>
          {status === 'draft' && (
            <Button type="button" onClick={handleConfirm} className="bg-teal-700 hover:bg-teal-800">Confirm</Button>
          )}
          {status === 'confirmed' && (
            <Button type="button" variant="outline" onClick={handleArchive}>Archive</Button>
          )}
        </>
      }
    >
      <form id="contact-form" onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column: Primary Info */}
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <Label className="font-medium">Contact Name</Label>
                  <Input
                    {...register('name')}
                    className="text-xl font-bold h-12 border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50"
                    placeholder="e.g. Jubilant Buffalo"
                    disabled={isReadOnly}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                  <Label className="text-muted-foreground text-right font-medium">Email</Label>
                  <div className="space-y-1">
                    <Input {...register('email')} placeholder="email@example.com" disabled={isReadOnly} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                  <Label className="text-muted-foreground text-right font-medium">Phone</Label>
                  <div className="space-y-1">
                    <Input {...register('phone')} placeholder="+91 99999 99999" disabled={isReadOnly} />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-4 items-start pt-2">
                  <Label className="text-muted-foreground text-right pt-2 font-medium">Address</Label>
                  <div className="space-y-2">
                    <Input {...register('street')} placeholder="Street Address" disabled={isReadOnly} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input {...register('city')} placeholder="City" disabled={isReadOnly} />
                      <Input {...register('state')} placeholder="State" disabled={isReadOnly} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input {...register('country')} placeholder="Country" disabled={isReadOnly} />
                      <Input {...register('pincode')} placeholder="Pincode" disabled={isReadOnly} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                  <Label className="text-muted-foreground text-right font-medium">Type</Label>
                  <select
                    {...register('type')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isReadOnly}
                  >
                    <option value="customer">Customer</option>
                    <option value="vendor">Vendor</option>
                  </select>
                </div>
              </div>

              {/* Right Column: Image & Tags */}
              <div className="w-full md:w-1/3 flex flex-col items-center space-y-6">
                {/* Image Placeholder */}
                <div className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors relative group overflow-hidden bg-muted/10">
                  {watch('image') ? (
                    <img src={watch('image')} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="h-8 w-8 mb-2 opacity-50" />
                      <span className="text-xs font-medium">Upload Image</span>
                    </>
                  )}
                  <Input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isReadOnly}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setValue('image', reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>

                {/* Tags */}
                <div className="w-full space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-1">
                      {activeTags.map(tag => (
                        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                          {tag}
                          {!isReadOnly && <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeTag(tag)} />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {!isReadOnly && (
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                        placeholder="Add tag..."
                        className="h-8 text-sm"
                      />
                      <Button type="button" size="sm" variant="ghost" onClick={addTag}><Plus className="h-4 w-4" /></Button>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    *Tags classify the contact (e.g., VIP, Local)
                  </p>
                </div>

                <div className="w-full pt-4 space-y-4">
                  {watch('type') === 'customer' && (
                    <>
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/20">
                        <input type="checkbox" id="portalAccess" {...register('portalAccess')} className="rounded border-primary text-primary focus:ring-primary h-4 w-4" disabled={isReadOnly || (isEdit && remoteContact?.portalAccess)} />
                        <Label htmlFor="portalAccess" className="text-sm cursor-pointer font-medium">Portal Access</Label>
                      </div>

                      {/* Portal Password Field - visible for NEW contacts OR existing contacts enabling portal access for the first time */}
                      {watch('portalAccess') && (!isEdit || (isEdit && !remoteContact?.portalAccess)) && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          <Label htmlFor="portalPassword" className="text-sm font-medium">Portal Password</Label>
                          <div className="flex gap-2">
                            <Input
                              id="portalPassword"
                              type="password"
                              placeholder="Enter password"
                              {...register('portalPassword')}
                              disabled={isReadOnly}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setValue('portalPassword', Math.random().toString(36).slice(-8))}
                              title="Generate Random Password"
                            >
                              Generate
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Password will be sent to the customer via email
                          </p>
                        </div>
                      )}

                      {/* Show message for existing contacts with portal access */}
                      {watch('portalAccess') && isEdit && remoteContact?.portalAccess && (
                        <div className="p-3 border rounded-md bg-muted/20">
                          <p className="text-sm text-muted-foreground">
                            ✓ Portal access already granted. Password was sent to customer's email.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </DocumentLayout>
  );
}
