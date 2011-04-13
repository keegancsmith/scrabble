from scrabble import ScrabbleGame
from scrabbleapp.fields import PickleField

from datetime import datetime

from django.db import models
from django.contrib.auth.models import User


class Game(models.Model):
    name = models.CharField(max_length=50)
    players = models.ManyToManyField(User, through='GamePlayer')
    winner = models.ForeignKey(User, null=True, blank=True, default=None,
                               related_name='winner')
    current_player = models.ForeignKey(User, related_name='playing')
    active = models.BooleanField(default=True)
    date_created = models.DateTimeField(default=datetime.now)
    last_played  = models.DateTimeField(default=datetime.now)
    turn = models.IntegerField(default=0)
    game_instance = PickleField()

    def get_players(self):
        return self.players.all().order_by('gameplayers__player_num')

    @classmethod
    def create_game(cls, players, name):
        if not name:
            name = "%s's game" % players[0].first_name
        game = cls(
            name=name,
            current_player=players[0],
            game_instance=ScrabbleGame(len(players))
        )
        game.save()
        for i, user in enumerate(players):
            player = GamePlayer(user=user, game=game, player_num=i)
            player.save()
        return game

    def __unicode__(self):
        game_str = u'Game %d - %s' % (self.pk, self.name)
        players_str = u', '.join(unicode(p) for p in self.players.all())
        if self.winner is not None:
            game_str += u' won by %s' % unicode(self.winner)
        return u'%s %s' % (game_str, players_str)


class GamePlayer(models.Model):
    user = models.ForeignKey(User)
    game = models.ForeignKey(Game)
    player_num = models.IntegerField()

    def __unicode__(self):
        return u'Player %d %s in game %d' % (self.player_num, self.user,
                                             self.game.pk)
