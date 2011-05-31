from scrabbleapp.models import Game

from datetime import datetime
from uuid import uuid4

from django.contrib.auth.models import User
from django.db import models


class GameLobby(models.Model):
    uuid = models.CharField(max_length=32, default=lambda:uuid4().hex,
                            editable=False, unique=True)
    game = models.ForeignKey(Game, null=True)
    date_created = models.DateTimeField(default=datetime.now)
    players = models.ManyToManyField(User, through='GameLobbyPlayer')

    def __unicode__(self):
        players = ','.join(p.username for p in self.players.all())
        return u'Game Lobby %s with [%s]' (self.uuid, players)

    @models.permalink
    def get_absolute_url(self):
        return ('lobby', [self.uuid])

    @property
    def creator(self):
        return self.gamelobbyplayer_set.get(player_num=0).user

    @property
    def game_started(self):
        return self.game is not None

    def is_full(self):
        return self.players.count() >= 4

    def add_player(self, user):
        assert not self.is_full()

        return GameLobbyPlayer.objects.create(
            user=user,
            game_lobby=self,
            player_num=self.players.count())

    def create_game(self):
        assert self.game == None
        self.game = Game.create_game(self.players.all())
        self.save()
        return self.game


class GameLobbyPlayer(models.Model):
    user = models.ForeignKey(User)
    game_lobby = models.ForeignKey(GameLobby)
    player_num = models.IntegerField()

    class Meta:
        ordering = ['player_num']
