from example_project.lazynewgame.models import GameLobby
from datetime import datetime, timedelta
from django.core.management.base import NoArgsCommand

class Command(NoArgsCommand):
    help = u"Remove all GameLobbys older than two weeks"

    def handle_noargs(self, **options):
        two_weeks_ago = datetime.now() - timedelta(days=14)
        GameLobby.objects.filter(date_created__lte=two_weeks_ago).delete()
