import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Pencil, Archive, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { contactStore } from '@/services/mockData';
import type { Contact, ContactType } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function Contacts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContactType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'confirmed' | 'archived'>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const { toast } = useToast();
  // Use local state to track data for reactivity
  const [data, setData] = useState<Contact[]>(contactStore.getAll());

  // Refresh data helper
  const refreshData = () => {
    setData([...contactStore.getAll()]);
    setSelected([]); // Clear selection on refresh
  };

  const filtered = data.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(filtered.map(c => c.id));
    } else {
      setSelected([]);
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelected(prev => [...prev, id]);
    } else {
      setSelected(prev => prev.filter(i => i !== id));
    }
  };

  const handleArchive = (id: string, name: string) => {
    contactStore.archive(id);
    toast({ title: 'Archived', description: `${name} has been archived.` });
    refreshData();
  };

  const handleBulkArchive = () => {
    selected.forEach(id => contactStore.archive(id));
    toast({ title: 'Bulk Archived', description: `${selected.length} contacts archived.` });
    refreshData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage customers and vendors</p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <Button variant="destructive" onClick={handleBulkArchive}>
              <Trash2 className="h-4 w-4 mr-2" />
              Archive ({selected.length})
            </Button>
          )}
          <Button asChild>
            <Link to="/account/contacts/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
          <CardDescription>Search and filter contacts</CardDescription>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as ContactType | 'all')}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All types</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All status</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={filtered.length > 0 && selected.length === filtered.length}
                    onCheckedChange={(c) => toggleSelectAll(!!c)}
                  />
                </TableHead>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Contact Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No contacts found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(c => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/account/contacts/${c.id}/edit`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.includes(c.id)}
                        onCheckedChange={(chk) => toggleSelect(c.id, !!chk)}
                      />
                    </TableCell>
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={c.image} alt={c.name} />
                        <AvatarFallback>{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="hover:underline">
                        {c.name}
                      </span>
                    </TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'confirmed' ? 'default' : c.status === 'draft' ? 'secondary' : 'outline'}>
                        {c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
