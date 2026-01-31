import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Smartphone, Building2, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { customerInvoiceStore, invoicePaymentStore } from '@/services/mockData';
import { useToast } from '@/hooks/use-toast';

type Step = 'choose' | 'checkout' | 'success';

export default function PortalPay() {
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('choose');
  const [payType, setPayType] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const invoice = invoiceId ? customerInvoiceStore.getById(invoiceId) : null;
  const amountDue = invoice ? invoice.total - invoice.paidAmount : 0;
  const payAmount = payType === 'full' ? amountDue : Math.min(Number(partialAmount) || 0, amountDue);

  if (!invoiceId || !invoice) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <p className="text-muted-foreground mb-4">Invoice not found.</p>
        <Button asChild><Link to="/portal/invoices">Back to My Invoices</Link></Button>
      </div>
    );
  }

  if (amountDue <= 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <p className="text-muted-foreground mb-4">This invoice is already paid.</p>
        <Button asChild><Link to="/portal/invoices">Back to My Invoices</Link></Button>
      </div>
    );
  }

  const handleContinue = () => {
    if (payType === 'partial') {
      const amt = Number(partialAmount);
      if (!amt || amt <= 0 || amt > amountDue) {
        toast({ title: 'Invalid amount', description: 'Enter an amount between 1 and ' + amountDue, variant: 'destructive' });
        return;
      }
    }
    setStep('checkout');
  };

  const handlePayNow = () => {
    if (!invoiceId || payAmount <= 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      invoicePaymentStore.create({
        invoiceId,
        amount: payAmount,
        paymentMode: 'UPI',
        paymentDate: new Date().toISOString().slice(0, 10),
        referenceId: 'RZP' + Date.now(),
      });
      setIsProcessing(false);
      setStep('success');
      toast({ title: 'Payment successful', description: 'Thanks for your payment.' });
    }, 1500);
  };

  if (step === 'choose') {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/portal/invoices" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to My Invoices
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Pay Now</CardTitle>
            <CardDescription>Invoice {invoice.invoiceNumber} — Amount due: ₹{amountDue.toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Choose payment type</Label>
              <RadioGroup value={payType} onValueChange={(v) => setPayType(v as 'full' | 'partial')} className="flex flex-col gap-3">
                <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-muted/50">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="flex-1 cursor-pointer font-normal">
                    <span className="font-medium">Full Pay</span> — Pay ₹{amountDue.toLocaleString()} (full amount due)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-muted/50">
                  <RadioGroupItem value="partial" id="partial" />
                  <Label htmlFor="partial" className="flex-1 cursor-pointer font-normal">
                    <span className="font-medium">Partial Pay</span> — Pay a part of the amount
                  </Label>
                </div>
              </RadioGroup>
            </div>
            {payType === 'partial' && (
              <div className="space-y-2">
                <Label htmlFor="partialAmount">Amount (₹)</Label>
                <Input
                  id="partialAmount"
                  type="number"
                  min={1}
                  max={amountDue}
                  step={1}
                  placeholder={`Max ₹${amountDue.toLocaleString()}`}
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                />
              </div>
            )}
            <Button className="w-full" onClick={handleContinue}>
              Continue to Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'checkout') {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Button variant="ghost" size="icon" onClick={() => setStep('choose')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-foreground">Shiv Furniture</span>
        </div>
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">Cards, UPI & More</CardTitle>
            <CardDescription>Choose your payment method</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="flex items-center gap-4 p-4 hover:bg-muted/30 cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">UPI / QR</p>
                  <p className="text-xs text-muted-foreground">Google Pay, PhonePe, Paytm, and more</p>
                </div>
                <span className="text-xs text-muted-foreground">more</span>
              </div>
              <div className="flex items-center gap-4 p-4 hover:bg-muted/30 cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Cards</p>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard, RuPay — All Indian banks</p>
                </div>
                <span className="text-xs text-muted-foreground">more</span>
              </div>
              <div className="flex items-center gap-4 p-4 hover:bg-muted/30 cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Net banking</p>
                  <p className="text-xs text-muted-foreground">All Indian banks</p>
                </div>
                <span className="text-xs text-muted-foreground">more</span>
              </div>
              <div className="flex items-center gap-4 p-4 hover:bg-muted/30 cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">EMI</p>
                  <p className="text-xs text-muted-foreground">Card, EarlySalary and more</p>
                </div>
                <span className="text-xs text-muted-foreground">more</span>
              </div>
              <div className="flex items-center gap-4 p-4 hover:bg-muted/30 cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Pay Later</p>
                  <p className="text-xs text-muted-foreground">LazyPay, ICICI, FlexiPay</p>
                </div>
                <span className="text-xs text-muted-foreground">more</span>
              </div>
              <div className="flex items-center gap-4 p-4 hover:bg-muted/30 cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Wallet</p>
                  <p className="text-xs text-muted-foreground">PhonePe & More</p>
                </div>
                <span className="text-xs text-muted-foreground">more</span>
              </div>
            </div>
          </CardContent>
          <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm text-muted-foreground">Total amount</p>
              <p className="text-lg font-semibold">₹ {payAmount.toLocaleString()}</p>
            </div>
            <Button onClick={handlePayNow} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pay Now'}
            </Button>
          </div>
        </Card>
        <p className="text-center text-xs text-muted-foreground">Secure checkout · Powered by Razorpay (demo)</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">Thanks for your payment</h2>
          <p className="text-sm text-muted-foreground mt-1">A payment will appear on your statement</p>
          <p className="mt-4 text-2xl font-bold">₹{payAmount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-2">Powered by Razorpay</p>
          <Button className="mt-6" asChild>
            <Link to="/portal/invoices">Back to My Invoices</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
