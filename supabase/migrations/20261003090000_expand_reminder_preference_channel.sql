alter table public.reminder_preferences
drop constraint if exists reminder_preferences_channel_check;

alter table public.reminder_preferences
add constraint reminder_preferences_channel_check
check (channel in ('telegram', 'web_push', 'both'));
