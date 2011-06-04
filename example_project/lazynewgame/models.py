from scrabbleapp.models import Game

from datetime import datetime
from string import ascii_letters, digits
from uuid import uuid4

from django.contrib.auth.models import User
from django.db import models


def _create_uuid():
    '''Creates a string representing a shortened UUID

    The reason the UUID is shortened to create prettier urls, instead of
    massive hex representations of an 128-bit number. However, this means that
    a UUID is likely to be unique.
    '''
    chars = ascii_letters + digits
    uuid = uuid4()

    # 32 bits should be enough
    x = uuid.int % 2**32
    uuid_str = []
    while x:
        uuid_str.append(chars[x % len(chars)])
        x /= len(chars)
    return ''.join(uuid_str)


class GameLobby(models.Model):
    # uuid is set to unique, but it can collide with another row's
    # uuid. Ignore this possibility for now for when it actually occurs.
    uuid = models.CharField(max_length=32, default=_create_uuid,
                            editable=False, unique=True)
    game = models.ForeignKey(Game, null=True)
    date_created = models.DateTimeField(default=datetime.now)
    players = models.ManyToManyField(User, through='GameLobbyPlayer')

    def __unicode__(self):
        players = ','.join(p.username for p in self.players.all())
        return u'Game Lobby %s with [%s]' % (self.uuid, players)

    @models.permalink
    def get_absolute_url(self):
        return ('lobby', [self.uuid])

    @property
    def creator(self):
        return self.gamelobbyplayer_set.get(player_num=0).user

    @property
    def game_started(self):
        return self.game is not None

    def user_can_join(self, user):
        return not self.is_full() and user not in self.players.all()

    def is_full(self):
        return self.players.count() >= 4

    def add_player(self, user):
        player_num = self.players.count()
        assert self.user_can_join(user)
        assert player_num < 4

        return GameLobbyPlayer.objects.create(
            user=user,
            game_lobby=self,
            player_num=player_num)

    def create_game(self):
        assert self.game == None
        self.game = Game.create_game(self.players.all())
        self.save()
        return self.game


class GameLobbyPlayer(models.Model):
    user = models.ForeignKey(User)
    game_lobby = models.ForeignKey(GameLobby)
    player_num = models.IntegerField(unique=True)

    class Meta:
        ordering = ['player_num']

    def __unicode__(self):
        return u'%d %s' % (self.player_num, self.user.username)
