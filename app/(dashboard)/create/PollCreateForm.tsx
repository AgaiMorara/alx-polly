'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createPoll } from '@/app/lib/actions/poll-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

const createPollSchema = z.object({
  question: z.string().min(1, { message: "Question is required" }),
  options: z.array(z.string().min(1, { message: "Option is required" })).min(2, { message: "At least two options are required" }),
});

type CreatePollFormValues = z.infer<typeof createPollSchema>;

export default function PollCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // VULNERABILITY ADDRESSED: Frontend Input Validation
  // HOW: We are using `react-hook-form` and `zod` to validate the form data on the client-side.
  // This prevents users from submitting invalid data and provides immediate feedback.
  const { register, control, handleSubmit, formState: { errors } } = useForm<CreatePollFormValues>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      question: '',
      options: ['', ''],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  // VULNERABILITY ADDRESSED: Server-Side Input Validation
  // HOW: The `onSubmit` function now takes the validated form data as input.
  // This data is then passed to the `createPoll` server action, which also validates the data on the server-side.
  // This prevents malicious users from bypassing the client-side validation and submitting harmful data.
  const onSubmit = async (data: CreatePollFormValues) => {
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('question', data.question);
    data.options.forEach(option => formData.append('options', option));

    const res = await createPoll(formData);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/polls');
      }, 1200);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 max-w-md mx-auto"
    >
      <div>
        <Label htmlFor="question">Poll Question</Label>
        <Input id="question" {...register('question')} />
        {errors.question && <p className="text-red-500 text-sm">{errors.question.message}</p>}
      </div>
      <div>
        <Label>Options</Label>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2 mb-2">
            <Input
              {...register(`options.${index}`)}
            />
            {fields.length > 2 && (
              <Button type="button" variant="destructive" onClick={() => remove(index)}>
                Remove
              </Button>
            )}
          </div>
        ))}
        {errors.options && <p className="text-red-500 text-sm">{errors.options.message}</p>}
        <Button type="button" onClick={() => append('')} variant="secondary">
          Add Option
        </Button>
      </div>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">Poll created! Redirecting...</div>}
      <Button type="submit">Create Poll</Button>
    </form>
  );
}