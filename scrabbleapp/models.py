from scrabble import ScrabbleGame
from scrabbleapp import pubsub

from datetime import datetime

from django.db import models
from django.contrib.auth.models import User
from django.utils.html import urlize
from picklefield.fields import PickledObjectField


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
    game_instance = PickledObjectField()

    def get_players(self):
        return self.players.all().order_by('gameplayer__player_num')

    def get_player(self, player_num):
        return self.gameplayer_set.get(player_num=player_num).user

    @classmethod
    def create_game(cls, players, name=None):
        if not name:
            name = "%s's game" % players[0].username
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

    def do_move(self, move, *args, **kw):
        assert self.active
        assert (self.gameplayer_set.get(user=self.current_player).player_num
                == self.game_instance.player)
        assert move in ('play_tiles', 'skip', 'swap')

        g = self.game_instance
        player_num = g.player
        ret = getattr(g, move)(*args, **kw)

        # Update fields to reflect change in game state
        self.current_player = self.get_player(g.player)
        self.last_played = datetime.now()
        self.turn += 1
        if g.winners:
            # XXX currently don't support multiple winners
            self.winner = self.get_player(g.winners[0])

        self.save()

        if move == 'play_tiles':
            words = ('%s: %d' % (word, score) for (word, _, _), score
                     in ret['words'].iteritems())
            msg = 'scored %d points\n%s' % (ret['score'], '\n'.join(words))
        elif move == 'skip':
            msg = 'skipped'
        else:
            msg = 'swapped %d tiles' % ret
        msg = urlize(msg, autoescape=True).replace('\n', '<br />')
        pubsub.publish_move(self.id, player_num, msg)

        return ret

    def chat(self, player, msg):
        player_num = self.gameplayer_set.get(user=player).player_num
        msg = urlize(msg, autoescape=True).replace('\n', '<br />')
        pubsub.publish_chat(self.id, player_num, msg)

    def notification_history(self, cursor=0):
        return pubsub.history(self.id, cursor)

    def cursor(self):
        return pubsub.cursor(self.id)

    def wait(self):
        return pubsub.wait(self.id)

    @models.permalink
    def get_absolute_url(self):
        return ('game', [str(self.id)])

    def __unicode__(self):
        game_str = u'Game %d - %s' % (self.pk, self.name)
        def mark_current_player(p):
            if p == self.current_player:
                return unicode(p) + '*'
            else:
                return unicode(p)
        players_str = u', '.join(map(mark_current_player, self.get_players()))
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
