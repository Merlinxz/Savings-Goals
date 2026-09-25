import React from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Goal } from '@/types';
import { useGoalsStore } from '@/store/useGoalsStore';

interface DeleteGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  onDeleted?: () => void;
}

export function DeleteGoalDialog({
  open,
  onOpenChange,
  goal,
  onDeleted,
}: DeleteGoalDialogProps) {
  const { deleteGoal } = useGoalsStore();

  if (!goal) return null;

  const handleDelete = () => {
    deleteGoal(goal.id);
    toast.success(`Deleted "${goal.name}"`);
    onOpenChange(false);
    onDeleted?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this savings goal?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong className="text-foreground font-semibold">"{goal.name}"</strong>?
            This will also remove all its recorded transaction history permanently.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Goal
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
