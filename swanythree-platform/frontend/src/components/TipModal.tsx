/**
 * SwanyThree Tip Modal — Send tips with fee preview.
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { paymentsApi } from '@/services/api';
import { useTip } from '@/hooks/queries';

const tipSchema = z.object({
  amount: z.number().min(100, 'Minimum tip is $1.00'),
  message: z.string().max(200).optional(),
});

type TipForm = z.infer<typeof tipSchema>;

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamId: string;
}

const PRESETS = [100, 500, 1000, 2500, 5000, 10000];

export default function TipModal({ isOpen, onClose, streamId }: TipModalProps) {
  const [fees, setFees] = useState<{ gross_amount: number; processor_fee: number; platform_fee: number; creator_amount: number } | null>(null);
  const tipMutation = useTip();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TipForm>({
    resolver: zodResolver(tipSchema),
    defaultValues: { amount: 500 },
  });

  const watchedAmount = watch('amount');

  useEffect(() => {
    if (!watchedAmount || watchedAmount < 100) {
      setFees(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await paymentsApi.calculateFees(watchedAmount);
        setFees(data);
      } catch {
        setFees(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [watchedAmount]);

  const onSubmit = async (data: TipForm) => {
    try {
      await tipMutation.mutateAsync({
        stream_id: streamId,
        amount: data.amount,
        message: data.message,
      });
      onClose();
    } catch {
      /* handled by mutation */
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send a Tip">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Preset Amounts */}
        <div>
          <label className="block text-sm font-medium text-st3-cream/70 mb-2">Quick Amount</label>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((cents) => (
              <button
                key={cents}
                type="button"
                onClick={() => setValue('amount', cents, { shouldValidate: true })}
                className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                  watchedAmount === cents
                    ? 'bg-st3-gold text-st3-dark'
                    : 'bg-st3-dark text-st3-cream hover:bg-st3-dark/80'
                }`}
              >
                ${(cents / 100).toFixed(0)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div>
          <label className="block text-sm font-medium text-st3-cream/70 mb-1">Custom (cents)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-st3-cream/40" />
            <input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              min={100}
              className="w-full pl-9"
              placeholder="500"
            />
          </div>
          {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-st3-cream/70 mb-1">Message (optional)</label>
          <textarea {...register('message')} className="w-full h-20 resize-none" placeholder="Say something nice..." />
        </div>

        {/* Fee Preview */}
        {fees && (
          <div className="bg-st3-dark rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-st3-cream/60">Amount</span>
              <span>${fees.gross_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-orange-400">
              <span>Processor fee</span>
              <span>-${fees.processor_fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>Platform fee (10%)</span>
              <span>-${fees.platform_fee.toFixed(2)}</span>
            </div>
            <div className="border-t border-st3-burgundy/20 pt-1 flex justify-between font-bold text-green-400">
              <span>Creator receives</span>
              <span>${fees.creator_amount.toFixed(2)}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={tipMutation.isPending}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {tipMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Send ${watchedAmount ? (watchedAmount / 100).toFixed(2) : '0.00'} Tip
        </button>
      </form>
    </Modal>
  );
}
