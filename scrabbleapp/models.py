from django.db import models
from django.contrib.auth.models import User


class Game(models.Model):
    name = models.CharField(max_length=50)
    players = models.ManyToManyField(User, through='GamePlayers')
    winner = models.ForeignKey(User, null=True, blank=True, default=None,
                               related_name='winner')
    current_player = models.ForeignKey(User, related_name='playing')
    active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now=True)

    def get_players(self):
        return self.players.all().order_by('gameplayers__player_num')

    def __unicode__(self):
        game_str = u'Game %d - %s' % (self.pk, self.name)
        players_str = u', '.join(unicode(p) for p in self.players.all())
        if self.winner is not None:
            game_str += u' won by %s' % unicode(self.winner)
        return u'%s %s' % (game_str, players_str)


class GamePlayers(models.Model):
    user = models.ForeignKey(User)
    game = models.ForeignKey(Game)
    player_num = models.IntegerField()

    class Meta:
        verbose_name_plural = 'Game Players'

    def __unicode__(self):
        return u'Player %d %s in game %d' % (self.player_num, self.user,
                                             self.game.pk)
