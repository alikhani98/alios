alter table public.reminder_delivery_log
drop constraint if exists reminder_delivery_log_category_check;

alter table public.reminder_delivery_log
add constraint reminder_delivery_log_category_check
check (category in ('task_due', 'finance_obligation', 'weekly_review'));
