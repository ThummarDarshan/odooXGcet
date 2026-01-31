import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Pencil, Search, Loader2 } from 'lucide-react';
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
import { useCostCenters } from '@/hooks/useData';

export default function CostCenters() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data: all = [], isLoading } = useCostCenters();

  const filtered = all.filter(cc =>
    !search ||
    cc.name.toLowerCase().includes(search.toLowerCase()) ||
    (cc.code || '').toLowerCase().includes(search.toLowerCase()) ||
    (cc.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cost Centers</h1>
          <p className="text-muted-foreground">Analytical accounts for budget tracking</p>
        </div>
        <Button asChild>
          <Link to="/account/cost-centers/create">
            <Plus className="h-4 w-4 mr-2" />
            Add Cost Center
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Cost Centers</CardTitle>
          <CardDescription>Search by name, code or description</CardDescription>
          <div className="relative max-w-sm pt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No cost centers found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(cc => (
                  <TableRow
                    key={cc.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/account/cost-centers/${cc.id}/edit`)}
                  >
                    <TableCell className="font-medium font-mono text-xs">{cc.code}</TableCell>
                    <TableCell className="font-medium">{cc.name}</TableCell>
                    <TableCell>{cc.description}</TableCell>
                    <TableCell>
                      <Badge variant={cc.status === 'active' ? 'default' : 'outline'}>{cc.status}</Badge>
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
