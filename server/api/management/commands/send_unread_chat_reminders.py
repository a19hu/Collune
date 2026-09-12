from django.core.management.base import BaseCommand

from api.message_queue.tasks import email_unread_chat_reminders


class Command(BaseCommand):
    help = "Email chat messages that have remained unread past the configured reminder delay."

    def handle(self, *args, **options):
        sent = email_unread_chat_reminders()
        self.stdout.write(self.style.SUCCESS(f"Sent {sent} unread chat email reminder(s)."))
