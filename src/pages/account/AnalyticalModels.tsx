import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Pencil, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { analyticalRuleStore, costCenterStore, productStore } from '@/services/mockData';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

export default function AnalyticalModels() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const all = analyticalRuleStore.getAll();
  const costCenters = costCenterStore.getAll();
  const products = productStore.getAll();
  const filtered = all.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));

  const getCostCenterName = (id: string) => costCenters.find(c => c.id === id)?.name ?? id;
  const getProductName = (id: string) => products.find(p => p.id === id)?.name ?? id;
  const getCategoryLabel = (cat: string) => PRODUCT_CATEGORIES.find(c => c.value === cat)?.label ?? cat;

  const handleToggle = (id: string, enabled: boolean) => {
    analyticalRuleStore.update(id, { enabled });
    toast({ title: enabled ? 'Rule enabled' : 'Rule disabled' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Auto Analytical Models</h1>
          <p className="text-muted-foreground">Product or Category to Cost Center mapping rules</p>
        </div>
        <Button asChild>
          <Link to="/account/analytical-models/create">
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rules</CardTitle>
          <CardDescription>Priority order; enable or disable per rule</CardDescription>
          <div className="relative max-w-sm pt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product or Category</TableHead>
                <TableHead>Cost Center</TableHead>
                <TableHead>Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No rules found.</TableCell>
                </TableRow>
              ) : (
                filtered.map(r => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/account/analytical-models/${r.id}/edit`)}
                  >
                    <TableCell>{r.priority}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell><Badge variant="secondary">{r.ruleType}</Badge></TableCell>
                    <TableCell>
                      {r.ruleType === 'product' && r.productId ? getProductName(r.productId) : r.category ? getCategoryLabel(r.category) : '-'}
                    </TableCell>
                    <TableCell>{getCostCenterName(r.costCenterId)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch checked={r.enabled} onCheckedChange={checked => handleToggle(r.id, checked)} />
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
