import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Pencil, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProducts } from '@/hooks/useData';
import { PRODUCT_CATEGORIES } from '@/lib/constants';

export default function Products() {
  const navigate = useNavigate();
  const { data: allProducts, isLoading } = useProducts();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'confirmed' | 'archived'>('confirmed');

  const all = allProducts || [];
  const filtered = all.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const getCategoryLabel = (value: string) => {
    const found = PRODUCT_CATEGORIES.find(c => c.value === value);
    return found ? found.label : value;
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage product catalog</p>
        </div>
        <Button asChild>
          <Link to="/account/products/create">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>Search and filter products</CardDescription>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All categories</option>
              {PRODUCT_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All status</option>
              <option value="confirmed">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sales Price</TableHead>
                <TableHead>Purchase Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(p => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/account/products/${p.id}/edit`)}
                  >
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{getCategoryLabel(p.category)}</TableCell>
                    <TableCell>Rs. {p.price.toLocaleString()}</TableCell>
                    <TableCell>Rs. {p.purchasePrice.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'confirmed' ? 'default' : 'secondary'}>
                        {p.status === 'confirmed' ? 'Active' : 'Archived'}
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
